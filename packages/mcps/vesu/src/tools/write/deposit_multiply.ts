import { Account } from 'starknet';
import {
  DepositMultiplyParams,
  DepositMultiplyResult,
} from '../../interfaces/index.js';
import { GENESIS_POOLID, DEFAULT_DECIMALS } from '../../lib/constants/index.js';
import { Hex, toBN } from '../../lib/utils/num.js';
import { getPool } from '../../lib/utils/pools.js';
import { formatTokenAmount } from '../../lib/utils/tokens.js';
import { getPoolContract } from '../../lib/utils/contracts.js';
import { onchainWrite } from '@kasarlabs/ask-starknet-core';
import { type EkuboQuote, type EkuboPoolKey } from '../../lib/utils/ekubo.js';
import { getEkuboQuoteSimple } from '../../lib/utils/getEkuboQuote.js';
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

      // Calculate debt amount based on target LTV or max LTV
      let targetLTVValue: bigint;
      if (params.targetLTV) {
        const ltvPercent = BigInt(params.targetLTV);
        if (ltvPercent >= 100n || ltvPercent < 0n) {
          throw new Error('Target LTV must be between 0 and 99');
        }
        // Convert percentage to basis points (e.g., 85% -> 8500)
        targetLTVValue = ltvPercent * 100n;

        const maxLTVValue = toBN(pairConfig.max_ltv);
        if (targetLTVValue > maxLTVValue) {
          const maxLTVPercent = Number(maxLTVValue) / 100;
          throw new Error(
            `Target LTV (${params.targetLTV}%) exceeds maximum LTV (${maxLTVPercent}%)`
          );
        }
      } else {
        targetLTVValue = toBN(pairConfig.max_ltv);
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

      let ekuboQuote: EkuboQuote | undefined = undefined;
      // Get slippage from params or use default (50 = 0.5%)
      const slippageBps: bigint = BigInt(params.ekuboSlippage ?? 50);

      try {
        // Determine token order (token0 must be lower address)
        const token0Address =
          debtAsset.address.toLowerCase() <
          collateralAsset.address.toLowerCase()
            ? debtAsset.address
            : collateralAsset.address;
        const token1Address =
          debtAsset.address.toLowerCase() <
          collateralAsset.address.toLowerCase()
            ? collateralAsset.address
            : debtAsset.address;

        // Get Ekubo pool parameters from params (using defaults from schema if not provided)
        const fee = params.ekuboFee ?? 0.05;
        const tickSpacing = params.ekuboTickSpacing ?? 0.1;
        // Normalize extension address (pad with zeros if needed)
        let extension = params.ekuboExtension ?? '0x0';
        if (extension === '0x0' || extension === '0x') {
          extension =
            '0x0000000000000000000000000000000000000000000000000000000000000000';
        }

        const TWO_POW_128 = 2n ** 128n;
        const feeDecimal = fee / 100;
        const feeU128 = BigInt(Math.floor(feeDecimal * Number(TWO_POW_128)));

        const spacingDecimal = tickSpacing / 100;
        const tickSpacingExp = BigInt(
          Math.round(Math.log(1 + spacingDecimal) / Math.log(1.000001))
        );

        const poolKey: EkuboPoolKey = {
          token0: token0Address,
          token1: token1Address,
          fee: feeU128,
          tickSpacing: tickSpacingExp,
          extension: extension,
        };
        const sqrtRatioLimit = 2n ** 128n; // Large value, router will adjust

        ekuboQuote = await getEkuboQuoteSimple(
          provider,
          debtAsset,
          collateralAsset,
          debtAmount,
          true, // exactIn: we know the debt amount we're borrowing
          poolKey,
          sqrtRatioLimit,
          0n // skipAhead
        );

        // If quote failed or has errors, log but continue without it
        if (ekuboQuote && ekuboQuote.error) {
          console.warn('Ekubo quote error:', ekuboQuote.error);
          ekuboQuote = undefined; // Fall back to no routing
        }
      } catch (error) {
        console.warn(
          'Failed to get Ekubo quote, continuing without swap routing:',
          error
        );
        ekuboQuote = undefined;
      }

      const callsData = await buildMultiplyCalls(
        collateralAmount,
        collateralAsset,
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
      console.error('Detailed multiply deposit error:', error);
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
 * @returns {Promise<DepositMultiplyResult>} Result of the multiply deposit operation
 */
export const depositMultiplyPosition = async (
  env: onchainWrite,
  params: DepositMultiplyParams
) => {
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
    return result;
  } catch (error) {
    // console.error('Detailed multiply deposit error:', error);
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
};
