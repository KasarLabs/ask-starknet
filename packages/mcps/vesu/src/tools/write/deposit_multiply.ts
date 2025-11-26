import { Account } from 'starknet';
import {
  DepositMultiplyParams,
  DepositMultiplyResult,
} from '../../interfaces/index.js';
import { GENESIS_POOLID } from '../../lib/constants/index.js';
import { Hex, toBN } from '../../lib/utils/num.js';
import { getPool } from '../../lib/utils/pools.js';
import { formatTokenAmount } from '../../lib/utils/tokens.js';
import { getPoolContract } from '../../lib/utils/contracts.js';
import { onchainWrite, toolResult } from '@kasarlabs/ask-starknet-core';
import {
  type EkuboQuote,
  getEkuboQuoteFromAPI,
} from '../../lib/utils/ekubo.js';
import { buildMultiplyCalls } from '../../lib/utils/multiplyCalls.js';

/**
 * Service for managing multiply deposit operations
 * @class DepositMultiplyService
 */
export class DepositMultiplyService {
  /**
   * Creates an instance of DepositMultiplyService
   * @param {onchainWrite} env - The onchain environment
   * @param {string} walletAddress - The wallet address executing the deposits
   */
  constructor(
    private env: onchainWrite,
    private walletAddress: string
  ) {}

  /**
   * Executes a multiply deposit transaction
   * @param {DepositMultiplyParams} params - Multiply deposit parameters
   * @param {onchainWrite} env - The onchain environment
   * @returns {Promise<DepositMultiplyResult>} Result of the multiply deposit operation
   */
  async depositMultiplyTransaction(
    params: DepositMultiplyParams,
    env: onchainWrite
  ): Promise<DepositMultiplyResult> {
    try {
      const account = new Account({
        provider: this.env.provider,
        address: this.walletAddress,
        signer: this.env.account.signer,
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

      // Convert human decimal amount to token decimals format
      const formattedAmount = formatTokenAmount(
        params.depositAmount,
        collateralAsset.decimals
      );
      const collateralAmount = BigInt(formattedAmount);

      // Get pool contract for v2
      const poolContract = getPoolContract(poolContractAddress);

      // Get LTV config from pool contract (v2 uses pair_config)
      const pairConfig = await poolContract.pair_config(
        collateralAsset.address as `0x${string}`,
        debtAsset.address as `0x${string}`
      );

      // Calculate debt amount based on target LTV
      if (!params.targetLTV) {
        throw new Error('Target LTV is required');
      }

      const ltvPercent = BigInt(params.targetLTV);
      if (ltvPercent >= 100n || ltvPercent < 0n) {
        throw new Error('Target LTV must be between 0 and 99');
      }
      // Convert percentage to basis points (e.g., 85% -> 8500)
      const targetLTVValue = ltvPercent * 100n;

      const maxLTVValue = toBN(pairConfig.max_ltv);
      if (targetLTVValue > maxLTVValue) {
        const maxLTVPercent = Number(maxLTVValue) / 100;
        throw new Error(
          `Target LTV (${params.targetLTV}%) exceeds maximum LTV (${maxLTVPercent}%)`
        );
      }

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

      const collateralValueUSD =
        (collateralAmount * toBN(collateralPrice.value)) /
        10n ** BigInt(collateralAsset.decimals);

      const safetyMargin = 999n;
      const adjustedLTV = (targetLTVValue * safetyMargin) / 1000n;

      const debtValueUSD =
        (collateralValueUSD * adjustedLTV) / (10000n - adjustedLTV);

      const debtAmount =
        (debtValueUSD * 10n ** BigInt(debtAsset.decimals)) /
        toBN(debtPrice.value);

      const provider = env.provider;
      const wallet = env.account;

      // Use Ekubo API to get quote and automatically extract pool parameters
      // For deposit: swap debt -> collateral, so order is debtToken/collateralToken
      let ekuboQuote: EkuboQuote | undefined = undefined;
      // Get slippage from params or use default (50 = 0.5%)
      const slippageBps: bigint = BigInt(params.ekuboSlippage ?? 50);

      const extraCollateralAmount =
        (debtValueUSD * 10n ** BigInt(collateralAsset.decimals)) /
        toBN(collateralPrice.value);

      try {
        ekuboQuote = await getEkuboQuoteFromAPI(
          provider,
          collateralAsset,
          debtAsset,
          extraCollateralAmount,
          false // exactOut
        );
      } catch (error) {
        console.warn(
          'Failed to get Ekubo quote from API, continuing without swap routing:',
          error
        );
        ekuboQuote = undefined;
      }

      const callsData = await buildMultiplyCalls(
        collateralAmount,
        collateralAsset,
        extraCollateralAmount,
        debtAsset,
        poolContractAddress,
        account,
        provider,
        ekuboQuote,
        slippageBps
      );

      // Convert calls to the format expected by wallet.execute
      const calls: any[] = callsData.map((call) => ({
        contractAddress: call.contractAddress,
        entrypoint: call.entrypoint,
        calldata: call.calldata,
      }));

      const tx = await wallet.execute(calls);

      await provider.waitForTransaction(tx.transaction_hash);

      const result: DepositMultiplyResult = {
        status: 'success',
        amount: params.depositAmount,
        collateralSymbol: params.collateralTokenSymbol,
        debtSymbol: params.debtTokenSymbol,
        recipient_address: account.address,
        transaction_hash: tx.transaction_hash,
      };

      return result;
    } catch (error) {
      return {
        status: 'failure',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Creates a new DepositMultiplyService instance
 * @param {onchainWrite} env - The onchain environment
 * @param {string} [walletAddress] - The wallet address
 * @returns {DepositMultiplyService} A new DepositMultiplyService instance
 * @throws {Error} If wallet address is not provided
 */
export const createDepositMultiplyService = (
  env: onchainWrite,
  walletAddress?: string
): DepositMultiplyService => {
  if (!walletAddress) {
    throw new Error('Wallet address not configured');
  }

  return new DepositMultiplyService(env, walletAddress);
};

/**
 * Utility function to execute a multiply deposit operation
 * @param {onchainWrite} env - The onchain environment
 * @param {DepositMultiplyParams} params - The multiply deposit parameters
 * @returns {Promise<toolResult>} Result of the multiply deposit operation
 */
export const depositMultiplyPosition = async (
  env: onchainWrite,
  params: DepositMultiplyParams
): Promise<toolResult> => {
  const accountAddress = env.account?.address;
  try {
    const depositMultiplyService = createDepositMultiplyService(
      env,
      accountAddress
    );
    const result = await depositMultiplyService.depositMultiplyTransaction(
      params,
      env
    );

    if (result.status === 'success') {
      return {
        status: 'success',
        data: {
          amount: result.amount,
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
