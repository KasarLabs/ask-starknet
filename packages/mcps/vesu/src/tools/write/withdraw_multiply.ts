import { Account } from 'starknet';
import {
  WithdrawMultiplyParams,
  WithdrawMultiplyResult,
} from '../../interfaces/index.js';
import { GENESIS_POOLID, VESU_API_URL } from '../../lib/constants/index.js';
import { Hex } from '../../lib/utils/num.js';
import { getPool } from '../../lib/utils/pools.js';
import { onchainWrite, toolResult } from '@kasarlabs/ask-starknet-core';
import {
  type EkuboQuote,
  type BigIntValue,
  getEkuboQuoteFromAPI,
} from '../../lib/utils/ekubo.js';
import {
  buildCloseMultiplyCalls,
  buildWithdrawMultiplyCalls,
} from '../../lib/utils/multiplyCalls.js';
import { formatTokenAmount } from '../../lib/utils/tokens.js';
import { z } from 'zod';

/**
 * Service for managing multiply withdraw operations
 * @class WithdrawMultiplyService
 */
export class WithdrawMultiplyService {
  /**
   * Creates an instance of WithdrawMultiplyService
   * @param {string} walletAddress - The wallet address executing the withdrawals
   */
  constructor(private walletAddress: string) {}

  /**
   * Executes a multiply withdraw transaction
   * @param {WithdrawMultiplyParams} params - Multiply withdraw parameters
   * @param {onchainWrite} env - The onchain environment
   * @returns {Promise<WithdrawMultiplyResult>} Result of the multiply withdraw operation
   */
  async withdrawMultiplyTransaction(
    params: WithdrawMultiplyParams,
    env: onchainWrite
  ): Promise<WithdrawMultiplyResult> {
    try {
      const account = new Account({
        provider: env.provider,
        address: this.walletAddress,
        signer: env.account.signer,
      });
      // For v2, poolId is the address of the pool contract
      const poolId = (params.poolId || GENESIS_POOLID) as Hex;
      const pool = await getPool(poolId);

      // Multiply operations are only supported on v2 pools
      if (pool.protocolVersion !== 'v2') {
        throw new Error(
          `Multiply operations are only supported on v2 pools. This pool is ${pool.protocolVersion}`
        );
      }

      // For v2, poolId is the pool contract address
      const poolContractAddress = poolId;

      // Find collateral and debt assets
      const collateralAsset = pool.assets.find(
        (a) =>
          a.symbol.toUpperCase() === params.collateralTokenSymbol.toUpperCase()
      );

      const debtAsset = pool.assets.find(
        (a) => a.symbol.toUpperCase() === params.debtTokenSymbol.toUpperCase()
      );

      if (!collateralAsset) {
        throw new Error('Collateral asset not found in pool');
      }

      if (!debtAsset) {
        throw new Error('Debt asset not found in pool');
      }

      const provider = env.provider;
      const wallet = env.account;

      const slippageBps: bigint = BigInt(params.ekuboSlippage ?? 50);

      // Fetch position to get debt amount
      let debtAmount: bigint;
      try {
        const queryParams = new URLSearchParams();
        queryParams.append('walletAddress', account.address);
        queryParams.append('type', 'multiply');

        const response = await fetch(
          `${VESU_API_URL}/positions?${queryParams.toString()}`
        );

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();

        // Parse the response
        const positionsSchema = z.object({
          data: z.array(
            z
              .object({
                type: z.string(),
                pool: z.object({
                  id: z.string(),
                }),
                collateral: z
                  .object({
                    symbol: z.string(),
                  })
                  .optional(),
                debt: z
                  .object({
                    symbol: z.string(),
                  })
                  .optional(),
                nominalDebt: z
                  .object({
                    value: z.string(),
                    decimals: z.number(),
                  })
                  .optional(),
              })
              .passthrough()
          ),
        });

        const parsedData = positionsSchema.parse(data);
        const positions = parsedData.data;

        const matchingPosition = positions.find((position: any) => {
          if (position.type !== 'multiply') return false;

          return (
            position.pool.id === poolId &&
            position.collateral?.symbol.toUpperCase() ===
              params.collateralTokenSymbol.toUpperCase() &&
            position.debt?.symbol.toUpperCase() ===
              params.debtTokenSymbol.toUpperCase()
          );
        });

        if (!matchingPosition) {
          throw new Error('No matching multiply position found');
        }

        // For v2, use nominalDebt.value
        if (
          !matchingPosition.nominalDebt ||
          !matchingPosition.nominalDebt.value
        ) {
          throw new Error('No nominalDebt found in position');
        }
        debtAmount = BigInt(matchingPosition.nominalDebt.value);
      } catch (error) {
        throw new Error(
          `Failed to get position data: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }

      // Check if withdrawAmount is provided and not "0"
      const shouldClosePosition =
        !params.withdrawAmount || params.withdrawAmount === '0';

      if (shouldClosePosition && debtAmount === 0n) {
        throw new Error('Position has no debt to close');
      }
      let ekuboQuote: EkuboQuote | undefined = undefined;
      if (shouldClosePosition) {
        try {
          // For close position: we want exact debt amount out
          // tokenOut = debtAsset, tokenIn = collateralAsset, amount = debtAmount, isExactIn = false (exactOut)
          ekuboQuote = await getEkuboQuoteFromAPI(
            provider,
            debtAsset,
            collateralAsset,
            debtAmount,
            false // exactOut
          );
        } catch (error) {
          console.error('ERROR while getting Ekubo quote:', error);
          console.warn(
            'Failed to get Ekubo quote from API, continuing without swap routing:',
            error
          );
          ekuboQuote = undefined;
        }
      }

      let callsData: any[];
      if (shouldClosePosition) {
        callsData = await buildCloseMultiplyCalls(
          collateralAsset,
          debtAsset,
          poolContractAddress,
          account,
          provider,
          ekuboQuote,
          slippageBps
        );
      } else {
        // Withdraw specific amount
        if (!params.withdrawAmount) {
          throw new Error('withdrawAmount is required for withdraw operation');
        }
        const formattedAmount = formatTokenAmount(
          params.withdrawAmount,
          collateralAsset.decimals
        );
        const withdrawAmountBigInt = BigInt(formattedAmount);

        const withdrawAmountValue: BigIntValue = {
          value: withdrawAmountBigInt,
          decimals: collateralAsset.decimals,
        };

        callsData = await buildWithdrawMultiplyCalls(
          collateralAsset,
          debtAsset,
          poolContractAddress,
          account,
          provider,
          withdrawAmountValue
        );
      }

      // Convert calls to the format expected by wallet.execute
      const calls: any[] = callsData.map((call) => ({
        contractAddress: call.contractAddress,
        entrypoint: call.entrypoint,
        calldata: call.calldata,
      }));

      const tx = await wallet.execute(calls);

      await provider.waitForTransaction(tx.transaction_hash);

      const result: WithdrawMultiplyResult = {
        status: 'success',
        collateralSymbol: params.collateralTokenSymbol,
        debtSymbol: params.debtTokenSymbol,
        recipient_address: account.address,
        transaction_hash: tx.transaction_hash,
      };

      return result;
    } catch (error) {
      console.error('Detailed multiply withdraw error:', error);
      return {
        status: 'failure',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Creates a new WithdrawMultiplyService instance
 * @param {onchainWrite} env - The onchain environment
 * @param {string} [walletAddress] - The wallet address
 * @returns {WithdrawMultiplyService} A new WithdrawMultiplyService instance
 * @throws {Error} If wallet address is not provided
 */
export const createWithdrawMultiplyService = (
  env: onchainWrite,
  walletAddress?: string
): WithdrawMultiplyService => {
  if (!walletAddress) {
    throw new Error('Wallet address not configured');
  }

  return new WithdrawMultiplyService(walletAddress);
};

/**
 * Utility function to execute a multiply withdraw operation
 * @param {onchainWrite} env - The onchain environment
 * @param {WithdrawMultiplyParams} params - The multiply withdraw parameters
 * @returns {Promise<toolResult>} Result of the multiply withdraw operation
 */
export const withdrawMultiplyPosition = async (
  env: onchainWrite,
  params: WithdrawMultiplyParams
): Promise<toolResult> => {
  const accountAddress = env.account?.address;
  try {
    const withdrawMultiplyService = createWithdrawMultiplyService(
      env,
      accountAddress
    );
    const result = await withdrawMultiplyService.withdrawMultiplyTransaction(
      params,
      env
    );

    if (result.status === 'success') {
      return {
        status: 'success',
        data: {
          collateralSymbol: result.collateralSymbol,
          debtSymbol: result.debtSymbol,
          recipient_address: result.recipient_address,
          transaction_hash: result.transaction_hash,
        },
      };
    } else {
      return {
        status: 'failure',
        error: result.error || 'Unknown error',
      };
    }
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
