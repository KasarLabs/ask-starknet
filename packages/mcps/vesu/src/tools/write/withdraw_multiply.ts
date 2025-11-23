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
  type EkuboSplit,
  type EkuboRoute,
} from '../../lib/utils/ekubo.js';
import { buildCloseMultiplyCalls } from '../../lib/utils/multiplyCalls.js';
import { z } from 'zod';

/**
 * Service for managing multiply withdraw operations
 * @class WithdrawMultiplyService
 */
export class WithdrawMultiplyService {
  /**
   * Creates an instance of WithdrawMultiplyService
   * @param {onchainWrite} env - The onchain environment
   * @param {string} walletAddress - The wallet address executing the withdrawals
   */
  constructor(
    private env: onchainWrite,
    private walletAddress: string
  ) {}

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

      if (debtAmount === 0n) {
        throw new Error('Position has no debt to close');
      }

      // Use Ekubo API to get quote and automatically extract pool parameters
      // For withdraw: swap debt -> collateral, so order is debtToken/collateralToken
      let ekuboQuote: EkuboQuote | undefined = undefined;
      try {
        // Call Ekubo quoter API: amount is negative for exactOut
        // Format: /{amount}/{tokenIn}/{tokenOut}
        // For withdraw (close position): we swap debt -> collateral
        const ekuboQuoterUrl = `https://starknet-mainnet-quoter-api.ekubo.org/${-debtAmount}/${debtAsset.address}/${collateralAsset.address}`;

        const ekuboResponse = await fetch(ekuboQuoterUrl);

        if (!ekuboResponse.ok) {
          throw new Error(
            `Ekubo API request failed with status ${ekuboResponse.status}`
          );
        }

        const ekuboData = await ekuboResponse.json();

        // Parse Ekubo response and extract pool parameters
        if (ekuboData.splits && ekuboData.splits.length > 0) {
          // Build Ekubo quote from API response
          const splits: EkuboSplit[] = ekuboData.splits.map(
            (splitData: any) => {
              const routes: EkuboRoute[] = splitData.route.map(
                (routeData: any, routeIdx: number) => {
                  // Handle fee: u128 parameter, can be number, string, or object {low, high}
                  // If object, use only low (u128 doesn't have high part)
                  let feeValue: bigint;
                  if (
                    typeof routeData.pool_key.fee === 'object' &&
                    routeData.pool_key.fee !== null
                  ) {
                    const feeObj = routeData.pool_key.fee as {
                      low?: any;
                      high?: any;
                    };
                    if (feeObj.low !== undefined) {
                      feeValue = BigInt(feeObj.low);
                    } else {
                      throw new Error(
                        `route[${routeIdx}].pool_key.fee is an object but missing low: ${JSON.stringify(routeData.pool_key.fee)}`
                      );
                    }
                  } else {
                    feeValue = BigInt(routeData.pool_key.fee);
                  }

                  // Handle tick_spacing: u128 parameter, can be number, string, or object {low, high}
                  // If object, use only low (u128 doesn't have high part)
                  let tickSpacingValue: bigint;
                  if (
                    typeof routeData.pool_key.tick_spacing === 'object' &&
                    routeData.pool_key.tick_spacing !== null
                  ) {
                    const tickSpacingObj = routeData.pool_key.tick_spacing as {
                      low?: any;
                      high?: any;
                    };
                    if (tickSpacingObj.low !== undefined) {
                      tickSpacingValue = BigInt(tickSpacingObj.low);
                    } else {
                      throw new Error(
                        `route[${routeIdx}].pool_key.tick_spacing is an object but missing low: ${JSON.stringify(routeData.pool_key.tick_spacing)}`
                      );
                    }
                  } else {
                    tickSpacingValue = BigInt(routeData.pool_key.tick_spacing);
                  }

                  // Handle extension: normalize to full hex string
                  let extensionValue = routeData.pool_key.extension || '0x0';
                  if (extensionValue === '0x0' || extensionValue === '0x') {
                    extensionValue =
                      '0x0000000000000000000000000000000000000000000000000000000000000000';
                  } else if (!extensionValue.startsWith('0x')) {
                    extensionValue = `0x${extensionValue}`;
                  }
                  // Pad extension to 66 chars (0x + 64 hex chars)
                  if (extensionValue.length < 66) {
                    const withoutPrefix = extensionValue.slice(2);
                    extensionValue = `0x${withoutPrefix.padStart(64, '0')}`;
                  }

                  // Handle sqrt_ratio_limit
                  let sqrtRatioLimitValue: bigint;
                  if (
                    typeof routeData.sqrt_ratio_limit === 'object' &&
                    routeData.sqrt_ratio_limit !== null
                  ) {
                    const { low, high } = routeData.sqrt_ratio_limit;
                    if (low !== undefined && high !== undefined) {
                      sqrtRatioLimitValue =
                        BigInt(low) + BigInt(high) * 2n ** 128n;
                    } else {
                      sqrtRatioLimitValue = 2n ** 128n;
                    }
                  } else if (routeData.sqrt_ratio_limit) {
                    sqrtRatioLimitValue = BigInt(routeData.sqrt_ratio_limit);
                  } else {
                    sqrtRatioLimitValue = 2n ** 128n;
                  }

                  // Handle skip_ahead: u128 parameter, can be number, string, or object {low, high}
                  // If object, use only low (u128 doesn't have high part)
                  let skipAheadValue: bigint;
                  if (
                    typeof routeData.skip_ahead === 'object' &&
                    routeData.skip_ahead !== null
                  ) {
                    const skipAheadObj = routeData.skip_ahead as {
                      low?: any;
                      high?: any;
                    };
                    if (skipAheadObj.low !== undefined) {
                      skipAheadValue = BigInt(skipAheadObj.low);
                    } else {
                      skipAheadValue = 0n;
                    }
                  } else {
                    skipAheadValue = BigInt(routeData.skip_ahead || 0);
                  }

                  return {
                    poolKey: {
                      token0: routeData.pool_key.token0,
                      token1: routeData.pool_key.token1,
                      fee: feeValue,
                      tickSpacing: tickSpacingValue,
                      extension: extensionValue,
                    },
                    sqrtRatioLimit: sqrtRatioLimitValue,
                    skipAhead: skipAheadValue,
                  };
                }
              );

              return {
                amountSpecified: BigInt(splitData.amount_specified), // Negative for exactOut
                amountCalculated: BigInt(splitData.amount_calculated), // Negative for exactOut
                route: routes,
              };
            }
          );

          ekuboQuote = {
            type: 'exactOut', // We're closing position, so exactOut
            splits,
            totalCalculated: BigInt(ekuboData.total_calculated), // Negative for exactOut
            priceImpact: ekuboData.price_impact || null,
          };
        }
      } catch (error) {
        console.error('ERROR while getting Ekubo quote:', error);
        console.warn(
          'Failed to get Ekubo quote from API, continuing without swap routing:',
          error
        );
        ekuboQuote = undefined;
      }

      const callsData = await buildCloseMultiplyCalls(
        collateralAsset,
        debtAsset,
        poolContractAddress,
        account,
        provider,
        ekuboQuote,
        slippageBps
      );

      console.error('=== WITHDRAW_MULTIPLY: After buildCloseMultiplyCalls ===');
      console.error('callsData.length:', callsData.length);
      console.error(
        'callsData entrypoints:',
        callsData.map((c) => c.entrypoint)
      );

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

  return new WithdrawMultiplyService(env, walletAddress);
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
