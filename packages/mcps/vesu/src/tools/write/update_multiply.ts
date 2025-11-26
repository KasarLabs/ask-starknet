import { Account, Contract } from 'starknet';
import {
  UpdateMultiplyParams,
  UpdateMultiplyResult,
} from '../../interfaces/index.js';
import { GENESIS_POOLID, VESU_API_URL } from '../../lib/constants/index.js';
import { Hex, toBN } from '../../lib/utils/num.js';
import { getPool } from '../../lib/utils/pools.js';
import { onchainWrite, toolResult } from '@kasarlabs/ask-starknet-core';
import {
  type EkuboQuote,
  type BigIntValue,
  getEkuboQuoteFromAPI,
  calculateEkuboWeights,
  calculateEkuboLeverSwapData,
  applySlippageToEkuboLimitAmount,
} from '../../lib/utils/ekubo.js';
import {
  getMultiplyContract,
  getPoolContract,
} from '../../lib/utils/contracts.js';
import {
  getDecreaseMultiplierCalls,
  getIncreaseMultiplierCalls,
} from '../../lib/utils/multiplyCalls.js';
import { CairoCustomEnum } from 'starknet';
import {
  MULTIPLY_CONTRACT_ADDRESS,
  DEFAULT_DECIMALS,
} from '../../lib/constants/index.js';
import { z } from 'zod';
import { computeCandD_from_T_and_N_wad } from '../../lib/utils/math.js';

const ZERO_BI: BigIntValue = { value: 0n, decimals: DEFAULT_DECIMALS };

/**
 * Service for managing multiply update operations (update LTV without depositing/withdrawing)
 * @class UpdateMultiplyService
 */
export class UpdateMultiplyService {
  /**
   * Creates an instance of UpdateMultiplyService
   * @param {onchainWrite} env - The onchain environment
   * @param {string} walletAddress - The wallet address executing the updates
   */
  constructor(
    private env: onchainWrite,
    private walletAddress: string
  ) {}

  /**
   * Executes a multiply update transaction
   * @param {UpdateMultiplyParams} params - Multiply update parameters
   * @param {onchainWrite} env - The onchain environment
   * @returns {Promise<UpdateMultiplyResult>} Result of the multiply update operation
   */
  async updateMultiplyTransaction(
    params: UpdateMultiplyParams,
    env: onchainWrite
  ): Promise<UpdateMultiplyResult> {
    try {
      const account = new Account(
        this.env.provider,
        this.walletAddress,
        this.env.account.signer
      );
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

      // Get pool contract for v2
      const poolContract = getPoolContract(poolContractAddress);

      const pairConfig = await poolContract.pair_config(
        collateralAsset.address as `0x${string}`,
        debtAsset.address as `0x${string}`
      );

      // Validate and convert target LTV
      const ltvPercent = BigInt(params.targetLTV);
      if (ltvPercent >= 100n || ltvPercent < 0n) {
        throw new Error('Target LTV must be between 0 and 99');
      }
      // Convert percentage to basis points (e.g., 85% -> 8500)
      const targetLTVValue = ltvPercent * 100n;
      // Convert to format with 18 decimals for comparison
      // API LTV format: 910000000000000000 = 91% (so 1% = 10^16)
      // targetLTV: 15 = 15%, so we need 15 * 10^16 = 150000000000000000
      const targetLTVWithDecimals = ltvPercent * 10n ** 16n;

      const maxLTVValue = toBN(pairConfig.max_ltv);
      if (targetLTVValue > maxLTVValue) {
        const maxLTVPercent = Number(maxLTVValue) / 100;
        throw new Error(
          `Target LTV (${params.targetLTV}%) exceeds maximum LTV (${maxLTVPercent}%)`
        );
      }

      // Fetch position to get current state
      let currentLTV: bigint;
      let currentCollateral: bigint;
      let currentDebt: bigint;
      let currentCollateralValueUSD: bigint;
      let currentDebtValueUSD: bigint;
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
                    value: z.string(),
                    decimals: z.number(),
                    usdPrice: z
                      .object({
                        value: z.string(),
                        decimals: z.number(),
                      })
                      .optional(),
                  })
                  .optional(),
                debt: z
                  .object({
                    symbol: z.string(),
                    value: z.string(),
                    decimals: z.number(),
                    usdPrice: z
                      .object({
                        value: z.string(),
                        decimals: z.number(),
                      })
                      .optional(),
                  })
                  .optional(),
                ltv: z
                  .object({
                    current: z.object({
                      value: z.string(),
                      decimals: z.number(),
                    }),
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

        // Get current LTV (has 18 decimals)
        if (!matchingPosition.ltv || !matchingPosition.ltv.current) {
          throw new Error('No current LTV found in position');
        }
        currentLTV = BigInt(matchingPosition.ltv.current.value);

        // Get current debt (for v2, use nominalDebt)
        if (
          !matchingPosition.nominalDebt ||
          !matchingPosition.nominalDebt.value
        ) {
          throw new Error('No nominalDebt found in position');
        }
        currentDebt = BigInt(matchingPosition.nominalDebt.value);

        // Get current collateral
        if (
          !matchingPosition.collateral ||
          !matchingPosition.collateral.value
        ) {
          throw new Error('No collateral found in position');
        }
        currentCollateral = BigInt(matchingPosition.collateral.value);

        if (
          !matchingPosition.collateral?.usdPrice ||
          !matchingPosition.collateral.usdPrice.value
        ) {
          throw new Error('No collateral usdPrice found in position');
        }
        if (
          !matchingPosition.debt?.usdPrice ||
          !matchingPosition.debt.usdPrice.value
        ) {
          throw new Error('No debt usdPrice found in position');
        }

        currentCollateralValueUSD = BigInt(
          matchingPosition.collateral.usdPrice.value
        );
        currentDebtValueUSD = BigInt(matchingPosition.debt.usdPrice.value);
      } catch (error) {
        throw new Error(
          `Failed to get position data: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
      if (currentLTV === targetLTVWithDecimals) {
        throw new Error(
          `Position LTV is already at target (${params.targetLTV}%)`
        );
      }

      const netValue = currentCollateralValueUSD! - currentDebtValueUSD!;

      const isIncreasing = currentLTV < targetLTVWithDecimals;

      const result_cd = computeCandD_from_T_and_N_wad(
        netValue,
        targetLTVWithDecimals,
        currentDebtValueUSD
      );

      // Get asset prices from pool contract (v2)
      const collateralPrice = await poolContract.price(
        collateralAsset.address as `0x${string}`
      );
      const debtPrice = await poolContract.price(
        debtAsset.address as `0x${string}`
      );

      if (!collateralPrice.is_valid || !debtPrice.is_valid) {
        throw new Error('Invalid price data for assets');
      }

      if (!result_cd || result_cd.deltaDebtWad === undefined) {
        throw new Error(
          'Cannot calculate deltaDebtTokenAmount: result_cd or deltaDebtWad is undefined'
        );
      }

      const collateralPriceBN = toBN(collateralPrice.value);

      if (collateralPriceBN === 0n) {
        throw new Error(
          'Collateral price is zero, cannot calculate deltaDebtTokenAmount'
        );
      }

      const deltaDebtTokenAmountRaw =
        (result_cd.deltaDebtWad * 10n ** BigInt(collateralAsset.decimals)) /
        collateralPriceBN;
      const deltaDebtTokenAmount =
        deltaDebtTokenAmountRaw < 0n
          ? -deltaDebtTokenAmountRaw
          : deltaDebtTokenAmountRaw;

      const provider = env.provider;
      const wallet = env.account;
      const slippageBps: bigint = BigInt(params.ekuboSlippage ?? 50);

      let ekuboQuote: EkuboQuote | undefined = undefined;

      if (result_cd && result_cd.deltaDebtWad !== undefined) {
        ekuboQuote = await getEkuboQuoteFromAPI(
          provider,
          collateralAsset,
          debtAsset,
          deltaDebtTokenAmount,
          isIncreasing ? false : true
        );
      }

      // Build calls based on whether we're increasing or decreasing
      let callsData: any[];

      if (isIncreasing) {
        // For increase: use getIncreaseMultiplierCalls helper
        callsData = await getIncreaseMultiplierCalls(
          collateralAsset,
          debtAsset,
          poolContractAddress,
          account,
          provider,
          ekuboQuote!,
          deltaDebtTokenAmount,
          slippageBps
        );
      } else {
        // For decrease: use getDecreaseMultiplierCalls helper
        const quotedAmount: BigIntValue = {
          value: deltaDebtTokenAmount,
          decimals: debtAsset.decimals,
        };

        const slippage: BigIntValue = {
          value: slippageBps,
          decimals: 4,
        };

        callsData = await getDecreaseMultiplierCalls(
          collateralAsset,
          debtAsset,
          poolContractAddress,
          account,
          provider,
          ekuboQuote!,
          quotedAmount,
          slippage
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

      const result: UpdateMultiplyResult = {
        status: 'success',
        collateralSymbol: params.collateralTokenSymbol,
        debtSymbol: params.debtTokenSymbol,
        targetLTV: params.targetLTV,
        recipient_address: account.address,
        transaction_hash: tx.transaction_hash,
      };
      return result;
    } catch (error) {
      if (error instanceof Error) {
        // console.error('Error type:', error.constructor.name);
        // console.error('Error message:', error.message);
        // console.error('Error stack:', error.stack);
      }
      return {
        status: 'failure',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Creates a new UpdateMultiplyService instance
 * @param {onchainWrite} env - The onchain environment
 * @param {string} [walletAddress] - The wallet address
 * @returns {UpdateMultiplyService} A new UpdateMultiplyService instance
 * @throws {Error} If wallet address is not provided
 */
export const createUpdateMultiplyService = (
  env: onchainWrite,
  walletAddress?: string
): UpdateMultiplyService => {
  if (!walletAddress) {
    throw new Error('Wallet address not configured');
  }

  return new UpdateMultiplyService(env, walletAddress);
};

/**
 * Utility function to execute a multiply update operation
 * @param {onchainWrite} env - The onchain environment
 * @param {UpdateMultiplyParams} params - The multiply update parameters
 * @returns {Promise<toolResult>} Result of the multiply update operation
 */
export const updateMultiplyPosition = async (
  env: onchainWrite,
  params: UpdateMultiplyParams
): Promise<toolResult> => {
  const accountAddress = env.account?.address;
  try {
    const updateMultiplyService = createUpdateMultiplyService(
      env,
      accountAddress
    );
    const result = await updateMultiplyService.updateMultiplyTransaction(
      params,
      env
    );

    if (result.status === 'success') {
      return {
        status: 'success',
        data: {
          collateralSymbol: result.collateralSymbol,
          debtSymbol: result.debtSymbol,
          targetLTV: result.targetLTV,
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
