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
  type EkuboSplit,
  type EkuboRoute,
  type BigIntValue,
  getEkuboQuoteFromAPI,
  calculateEkuboWeights,
  calculateEkuboLeverSwapData,
  applySlippageToEkuboLimitAmount,
  adjustEkuboWeights,
  safeStringify,
} from '../../lib/utils/ekubo.js';
import {
  getMultiplyContract,
  getPoolContract,
} from '../../lib/utils/contracts.js';
import { getDecreaseMultiplierCalls } from '../../lib/utils/multiplyCalls.js';
import { CairoCustomEnum } from 'starknet';
import {
  MULTIPLY_CONTRACT_ADDRESS,
  DEFAULT_DECIMALS,
} from '../../lib/constants/index.js';
import { z } from 'zod';

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
      console.error('=== updateMultiplyTransaction START ===');
      console.error('params:', safeStringify(params));
      console.error('walletAddress:', this.walletAddress);
      console.error('env.provider:', env.provider);
      console.error('env.account.address:', env.account?.address);

      const account = new Account(
        this.env.provider,
        this.walletAddress,
        this.env.account.signer
      );
      console.error('account.address:', account.address);
      // For v2, poolId is the address of the pool contract
      const poolId = (params.poolId || GENESIS_POOLID) as Hex;
      console.error('poolId:', poolId);
      const pool = await getPool(poolId);
      console.error('pool:', safeStringify(pool));

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
      console.error('collateralAsset:', safeStringify(collateralAsset));

      if (!debtAsset) {
        throw new Error('Debt asset not found in pool');
      }
      console.error('debtAsset:', safeStringify(debtAsset));

      // Get pool contract for v2
      const poolContract = getPoolContract(poolContractAddress);

      // Get LTV config from pool contract (v2 uses pair_config)
      const pairConfig = await poolContract.pair_config(
        collateralAsset.address as `0x${string}`,
        debtAsset.address as `0x${string}`
      );
      console.error('pairConfig:', safeStringify(pairConfig));

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
      console.error('targetLTVValue:', targetLTVValue.toString());
      console.error('targetLTVWithDecimals:', targetLTVWithDecimals.toString());

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
                  })
                  .optional(),
                debt: z
                  .object({
                    symbol: z.string(),
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
        console.error('currentLTV:', currentLTV.toString());

        // Get current debt (for v2, use nominalDebt)
        if (
          !matchingPosition.nominalDebt ||
          !matchingPosition.nominalDebt.value
        ) {
          throw new Error('No nominalDebt found in position');
        }
        currentDebt = BigInt(matchingPosition.nominalDebt.value);
        console.error('currentDebt:', currentDebt.toString());

        // Get current collateral
        if (
          !matchingPosition.collateral ||
          !matchingPosition.collateral.value
        ) {
          throw new Error('No collateral found in position');
        }
        currentCollateral = BigInt(matchingPosition.collateral.value);
        console.error('currentCollateral:', currentCollateral.toString());
      } catch (error) {
        throw new Error(
          `Failed to get position data: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }

      // Check if LTV is already at target
      // currentLTV has 18 decimals, targetLTVWithDecimals also has 18 decimals
      if (currentLTV === targetLTVWithDecimals) {
        throw new Error(
          `Position LTV is already at target (${params.targetLTV}%)`
        );
      }

      // Get asset prices from pool contract (v2)
      const collateralPrice = await poolContract.price(
        collateralAsset.address as `0x${string}`
      );
      const debtPrice = await poolContract.price(
        debtAsset.address as `0x${string}`
      );
      console.error('collateralPrice:', safeStringify(collateralPrice));
      console.error('debtPrice:', safeStringify(debtPrice));

      if (!collateralPrice.is_valid || !debtPrice.is_valid) {
        throw new Error('Invalid price data for assets');
      }

      // Calculate current collateral value in USD
      const currentCollateralValueUSD =
        (currentCollateral * toBN(collateralPrice.value)) /
        10n ** BigInt(collateralAsset.decimals);

      const currentDebtValueUSD =
        (currentDebt * toBN(debtPrice.value)) /
        10n ** BigInt(debtAsset.decimals);

      console.error(
        'currentCollateralValueUSD:',
        currentCollateralValueUSD.toString()
      );
      console.error('currentDebtValueUSD:', currentDebtValueUSD.toString());

      // Determine if we need to increase or decrease LTV
      // currentLTV has 18 decimals, targetLTVWithDecimals also has 18 decimals
      const isIncreasing = currentLTV < targetLTVWithDecimals;
      console.error('isIncreasing:', isIncreasing);

      // LTV in basis points: targetLTVValue = ltvPercent * 100n (déjà calculé plus haut)
      const ltvBps = targetLTVValue; // ex: 85% -> 8500
      const oneBps = 10000n;

      let targetDebtAmount: bigint;
      let debtDelta: bigint;
      let debtDeltaAbs: bigint;

      if (isIncreasing) {
        const numerator =
          ltvBps * currentCollateralValueUSD - oneBps * currentDebtValueUSD;
        const denominator = oneBps - ltvBps;

        if (denominator <= 0n) {
          throw new Error(
            `Invalid target LTV (${params.targetLTV}%), cannot compute leverage increase`
          );
        }

        if (numerator <= 0n) {
          throw new Error(
            `Target LTV (${params.targetLTV}%) is not higher than current LTV in USD terms`
          );
        }

        const deltaDebtValueUSD = numerator / denominator;
        console.error('deltaDebtValueUSD:', deltaDebtValueUSD.toString());

        const deltaDebtAmount =
          (deltaDebtValueUSD * 10n ** BigInt(debtAsset.decimals)) /
          toBN(debtPrice.value);
        console.error('deltaDebtAmount:', deltaDebtAmount.toString());

        targetDebtAmount = currentDebt + deltaDebtAmount;
        debtDelta = deltaDebtAmount;
        debtDeltaAbs = deltaDebtAmount;
      } else {
        const numerator =
          oneBps * currentDebtValueUSD - ltvBps * currentCollateralValueUSD;
        const denominator = oneBps - ltvBps;

        if (denominator <= 0n) {
          throw new Error(
            `Invalid target LTV (${params.targetLTV}%), cannot compute leverage decrease`
          );
        }

        if (numerator <= 0n) {
          throw new Error(
            `Target LTV (${params.targetLTV}%) is not lower than current LTV in USD terms`
          );
        }

        const deltaDebtValueUSD = numerator / denominator;
        console.error(
          'deltaDebtValueUSD (decrease):',
          deltaDebtValueUSD.toString()
        );

        const deltaDebtAmount =
          (deltaDebtValueUSD * 10n ** BigInt(debtAsset.decimals)) /
          toBN(debtPrice.value);
        console.error(
          'deltaDebtAmount (decrease):',
          deltaDebtAmount.toString()
        );

        targetDebtAmount = currentDebt - deltaDebtAmount;
        debtDelta = -deltaDebtAmount;
        debtDeltaAbs = deltaDebtAmount;
      }

      console.error('debtDelta:', debtDelta.toString());
      console.error('debtDeltaAbs:', debtDeltaAbs.toString());

      const provider = env.provider;
      const wallet = env.account;

      // Get slippage from params or use default (50 = 0.5%)
      const slippageBps: bigint = BigInt(params.ekuboSlippage ?? 50);
      console.error('slippageBps:', slippageBps.toString());

      // Get Ekubo quote if we have a debt delta
      let ekuboQuote: EkuboQuote | undefined = undefined;

      if (debtDeltaAbs > 0n) {
        console.error('Getting Ekubo quote, debtDeltaAbs > 0');
        try {
          if (isIncreasing) {
            console.error('=== Getting Ekubo quote for INCREASE ===');
            console.error('debtDeltaAbs:', debtDeltaAbs.toString());
            console.error('collateralAsset.address:', collateralAsset.address);
            console.error('debtAsset.address:', debtAsset.address);
            // For increase: swap debt -> collateral (we borrow more debt to buy more collateral)
            // Format: /{amount}/{tokenOut}/{tokenIn}
            // We want exact collateral amount out, so we use negative collateral amount
            // Calculate collateral amount needed from debt delta using current prices
            const debtValueUSD =
              (debtDeltaAbs * toBN(debtPrice.value)) /
              10n ** BigInt(debtAsset.decimals);
            const collateralAmountNeeded =
              (debtValueUSD * 10n ** BigInt(collateralAsset.decimals)) /
              toBN(collateralPrice.value);
            const ekuboQuoterUrl = `https://starknet-mainnet-quoter-api.ekubo.org/${-collateralAmountNeeded}/${collateralAsset.address}/${debtAsset.address}`;
            console.error('ekuboQuoterUrl:', ekuboQuoterUrl);
            console.error(
              'collateralAmountNeeded:',
              collateralAmountNeeded.toString()
            );

            const ekuboResponse = await fetch(ekuboQuoterUrl);

            if (!ekuboResponse.ok) {
              throw new Error(
                `Ekubo API request failed with status ${ekuboResponse.status}`
              );
            }

            const ekuboData = await ekuboResponse.json();
            console.error('ekuboData (increase):', safeStringify(ekuboData));

            // Parse Ekubo response and extract pool parameters
            if (ekuboData.splits && ekuboData.splits.length > 0) {
              // Build Ekubo quote from API response
              const splits: EkuboSplit[] = ekuboData.splits.map(
                (splitData: any) => {
                  const routes: EkuboRoute[] = splitData.route.map(
                    (routeData: any, routeIdx: number) => {
                      // Handle fee
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
                            `route[${routeIdx}].pool_key.fee is an object but missing low: ${safeStringify(routeData.pool_key.fee)}`
                          );
                        }
                      } else {
                        feeValue = BigInt(routeData.pool_key.fee);
                      }

                      // Handle tick_spacing
                      let tickSpacingValue: bigint;
                      if (
                        typeof routeData.pool_key.tick_spacing === 'object' &&
                        routeData.pool_key.tick_spacing !== null
                      ) {
                        const tickSpacingObj = routeData.pool_key
                          .tick_spacing as {
                          low?: any;
                          high?: any;
                        };
                        if (tickSpacingObj.low !== undefined) {
                          tickSpacingValue = BigInt(tickSpacingObj.low);
                        } else {
                          throw new Error(
                            `route[${routeIdx}].pool_key.tick_spacing is an object but missing low: ${safeStringify(routeData.pool_key.tick_spacing)}`
                          );
                        }
                      } else {
                        tickSpacingValue = BigInt(
                          routeData.pool_key.tick_spacing
                        );
                      }

                      // Handle extension
                      let extensionValue =
                        routeData.pool_key.extension || '0x0';
                      if (extensionValue === '0x0' || extensionValue === '0x') {
                        extensionValue =
                          '0x0000000000000000000000000000000000000000000000000000000000000000';
                      } else if (!extensionValue.startsWith('0x')) {
                        extensionValue = `0x${extensionValue}`;
                      }
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
                        sqrtRatioLimitValue = BigInt(
                          routeData.sqrt_ratio_limit
                        );
                      } else {
                        sqrtRatioLimitValue = 2n ** 128n;
                      }

                      // Handle skip_ahead
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
                    amountSpecified: BigInt(splitData.amount_specified),
                    amountCalculated: BigInt(splitData.amount_calculated),
                    route: routes,
                  };
                }
              );

              ekuboQuote = {
                type: 'exactOut',
                splits,
                totalCalculated: BigInt(ekuboData.total_calculated),
                priceImpact: ekuboData.price_impact || null,
              };
              console.error(
                'ekuboQuote (increase) created:',
                safeStringify({
                  type: ekuboQuote.type,
                  totalCalculated: ekuboQuote.totalCalculated.toString(),
                  splitsCount: ekuboQuote.splits.length,
                  priceImpact: ekuboQuote.priceImpact,
                })
              );
            }
          } else {
            console.error('=== Getting Ekubo quote for DECREASE ===');
            console.error('debtDeltaAbs:', debtDeltaAbs.toString());
            console.error('collateralAsset:', safeStringify(collateralAsset));
            console.error('debtAsset:', safeStringify(debtAsset));
            // For decrease: swap collateral -> debt (we sell collateral to repay debt)
            // We want exact debt amount out (to repay debtDeltaAbs)
            ekuboQuote = await getEkuboQuoteFromAPI(
              provider,
              collateralAsset,
              debtAsset,
              debtDeltaAbs,
              false // isExactIn = false, we want exactOut
            );
            console.error(
              'ekuboQuote (decrease) received:',
              safeStringify({
                type: ekuboQuote.type,
                totalCalculated: ekuboQuote.totalCalculated.toString(),
                splitsCount: ekuboQuote.splits.length,
                priceImpact: ekuboQuote.priceImpact,
              })
            );
          }
        } catch (error) {
          console.error('ERROR while getting Ekubo quote:', error);
          console.warn(
            'Failed to get Ekubo quote from API, continuing without swap routing:',
            error
          );
          ekuboQuote = undefined;
        }
      }

      // Build calls based on whether we're increasing or decreasing
      let callsData: any[];

      if (!isIncreasing && debtDeltaAbs > 0n && ekuboQuote) {
        console.error('=== Using getDecreaseMultiplierCalls ===');
        // For decrease: use getDecreaseMultiplierCalls helper
        const quotedAmount: BigIntValue = {
          value: debtDeltaAbs,
          decimals: debtAsset.decimals,
        };

        const slippage: BigIntValue = {
          value: slippageBps,
          decimals: 4,
        };

        console.error(
          'getDecreaseMultiplierCalls params:',
          safeStringify({
            collateralAsset: safeStringify(collateralAsset),
            debtAsset: safeStringify(debtAsset),
            poolContractAddress,
            accountAddress: account.address,
            quotedAmount: {
              value: quotedAmount.value.toString(),
              decimals: quotedAmount.decimals,
            },
            slippage: {
              value: slippage.value.toString(),
              decimals: slippage.decimals,
            },
            ekuboQuoteType: ekuboQuote.type,
            ekuboQuoteTotalCalculated: ekuboQuote.totalCalculated.toString(),
          })
        );

        callsData = await getDecreaseMultiplierCalls(
          collateralAsset,
          debtAsset,
          poolContractAddress,
          account,
          provider,
          ekuboQuote,
          quotedAmount,
          slippage
        );
        console.error(
          'callsData from getDecreaseMultiplierCalls:',
          safeStringify(
            callsData.map((c) => ({
              contractAddress: c.contractAddress,
              entrypoint: c.entrypoint,
              calldataLength: c.calldata?.length || 0,
            }))
          )
        );
      } else {
        console.error('=== Using buildUpdateMultiplyCalls ===');
        console.error(
          'buildUpdateMultiplyCalls params:',
          safeStringify({
            isIncreasing,
            collateralAsset: safeStringify(collateralAsset),
            debtAsset: safeStringify(debtAsset),
            poolContractAddress,
            accountAddress: account.address,
            ekuboQuote: ekuboQuote
              ? {
                  type: ekuboQuote.type,
                  totalCalculated: ekuboQuote.totalCalculated.toString(),
                  splitsCount: ekuboQuote.splits.length,
                }
              : undefined,
            debtDeltaAbs: debtDeltaAbs.toString(),
            slippageBps: slippageBps.toString(),
          })
        );
        // For increase or when no quote: use existing buildUpdateMultiplyCalls
        callsData = await this.buildUpdateMultiplyCalls(
          isIncreasing,
          collateralAsset,
          debtAsset,
          poolContractAddress,
          account,
          provider,
          ekuboQuote,
          debtDeltaAbs,
          slippageBps,
          collateralPrice,
          debtPrice
        );
        console.error(
          'callsData from buildUpdateMultiplyCalls:',
          safeStringify(
            callsData.map((c) => ({
              contractAddress: c.contractAddress,
              entrypoint: c.entrypoint,
              calldataLength: c.calldata?.length || 0,
            }))
          )
        );
      }

      // Convert calls to the format expected by wallet.execute
      const calls: any[] = callsData.map((call) => ({
        contractAddress: call.contractAddress,
        entrypoint: call.entrypoint,
        calldata: call.calldata,
      }));

      console.error('=== Final calls before execute ===');
      console.error('calls count:', calls.length);
      calls.forEach((call, idx) => {
        console.error(`call[${idx}]:`, {
          contractAddress: call.contractAddress,
          entrypoint: call.entrypoint,
          calldata: call.calldata,
        });
      });

      const tx = await wallet.execute(calls);
      console.error('Transaction hash:', tx.transaction_hash);

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
      console.error('Detailed multiply update error:', error);
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

  /**
   * Build calls for updating multiply position (increase or decrease LTV)
   */
  private async buildUpdateMultiplyCalls(
    isIncreasing: boolean,
    collateralAsset: any,
    debtAsset: any,
    poolContractAddress: Hex,
    account: Account,
    provider: any,
    ekuboQuote: EkuboQuote | undefined,
    quotedAmount: bigint,
    slippageBps: bigint,
    collateralPrice: any,
    debtPrice: any
  ): Promise<any[]> {
    console.error('=== buildUpdateMultiplyCalls START ===');
    console.error('isIncreasing:', isIncreasing);
    console.error('collateralAsset:', safeStringify(collateralAsset));
    console.error('debtAsset:', safeStringify(debtAsset));
    console.error('poolContractAddress:', poolContractAddress);
    console.error('account.address:', account.address);
    console.error('quotedAmount:', quotedAmount.toString());
    console.error('slippageBps:', slippageBps.toString());
    console.error(
      'ekuboQuote:',
      ekuboQuote
        ? {
            type: ekuboQuote.type,
            totalCalculated: ekuboQuote.totalCalculated.toString(),
            splitsCount: ekuboQuote.splits.length,
          }
        : undefined
    );
    console.error('collateralPrice:', safeStringify(collateralPrice));
    console.error('debtPrice:', safeStringify(debtPrice));

    const multiplyContract = getMultiplyContract(MULTIPLY_CONTRACT_ADDRESS);
    const poolContract = getPoolContract(poolContractAddress);

    const multiplyContractForTx = new Contract(
      multiplyContract.abi,
      MULTIPLY_CONTRACT_ADDRESS,
      provider
    );
    const poolContractForTx = new Contract(
      poolContract.abi,
      poolContractAddress,
      provider
    );

    // Step 1: Modify delegation (set to true)
    const modifyDelegationCall =
      await poolContractForTx.populateTransaction.modify_delegation(
        MULTIPLY_CONTRACT_ADDRESS,
        true
      );

    // Prepare Ekubo swap data if quote is available
    let leverSwap: any[] = [];
    let leverSwapLimitAmount = 0n;
    let adjustedWeights: bigint[] = [];

    if (ekuboQuote && ekuboQuote.splits.length > 0) {
      console.error(
        'Processing ekuboQuote, splits.length:',
        ekuboQuote.splits.length
      );
      const weights = calculateEkuboWeights(ekuboQuote);
      console.error(
        'weights:',
        weights.map((w) => w.toString())
      );

      const slippage: BigIntValue = {
        value: slippageBps,
        decimals: 4,
      };

      if (isIncreasing) {
        console.error('Building leverSwap for INCREASE');
        // For increase: similar to deposit_multiply -> buildMultiplyCalls
        // Quote is exactOut of collateral, totalCalculated is debt needed
        // quotedAmount is the debt amount we're giving
        const quotedAmountValue: BigIntValue = {
          value: quotedAmount,
          decimals: debtAsset.decimals,
        };
        console.error('quotedAmountValue:', {
          value: quotedAmountValue.value.toString(),
          decimals: quotedAmountValue.decimals,
        });
        leverSwap = calculateEkuboLeverSwapData(
          collateralAsset,
          quotedAmountValue,
          ekuboQuote,
          weights
        );
        console.error('leverSwap (increase):', safeStringify(leverSwap));

        leverSwapLimitAmount = applySlippageToEkuboLimitAmount(
          ekuboQuote.totalCalculated,
          ekuboQuote.type,
          slippage
        );
        console.error(
          'leverSwapLimitAmount (increase):',
          leverSwapLimitAmount.toString()
        );
      } else {
        console.error('Building leverSwap for DECREASE');
        // For decrease: similar to fn.ts getCloseMultiplyPositionCalls
        // Quote is exactOut of debt, totalCalculated is collateral needed
        // Use debtAsset as token and ZERO_BI as quotedAmount (like in getCloseMultiplyPositionCalls)

        const ZERO_BI: BigIntValue = { value: 0n, decimals: DEFAULT_DECIMALS };
        leverSwap = calculateEkuboLeverSwapData(
          debtAsset,
          ZERO_BI,
          ekuboQuote,
          weights
        );
        console.error('leverSwap (decrease):', safeStringify(leverSwap));
        adjustedWeights = adjustEkuboWeights(weights);
        console.error(
          'adjustedWeights:',
          adjustedWeights.map((w) => w.toString())
        );

        leverSwapLimitAmount = applySlippageToEkuboLimitAmount(
          ekuboQuote.totalCalculated,
          ekuboQuote.type,
          slippage
        );
        console.error(
          'leverSwapLimitAmount (decrease):',
          leverSwapLimitAmount.toString()
        );
        // In getCloseMultiplyPositionCalls, they don't take absolute value
        // But in buildCloseMultiplyCalls they do, so let's try without abs first
      }
    }

    // Step 2: Modify lever
    let modifyLeverCall;
    if (isIncreasing) {
      const increaseLeverParams = {
        pool: poolContractAddress,
        collateral_asset: collateralAsset.address,
        debt_asset: debtAsset.address,
        user: account.address,
        add_margin: ZERO_BI.value,
        margin_swap: [],
        margin_swap_limit_amount: ZERO_BI.value,
        lever_swap: leverSwap,
        lever_swap_limit_amount: leverSwapLimitAmount,
      };
      console.error(
        'IncreaseLever params:',
        safeStringify({
          ...increaseLeverParams,
          add_margin: increaseLeverParams.add_margin.toString(),
          margin_swap_limit_amount:
            increaseLeverParams.margin_swap_limit_amount.toString(),
          lever_swap_limit_amount:
            increaseLeverParams.lever_swap_limit_amount.toString(),
          lever_swap: increaseLeverParams.lever_swap,
        })
      );
      modifyLeverCall =
        await multiplyContractForTx.populateTransaction.modify_lever({
          action: new CairoCustomEnum({
            IncreaseLever: increaseLeverParams,
          }),
        });
    } else {
      const decreaseLeverParams = {
        pool: poolContractAddress,
        collateral_asset: collateralAsset.address,
        debt_asset: debtAsset.address,
        user: account.address,
        sub_margin: ZERO_BI.value,
        recipient: account.address,
        lever_swap: leverSwap,
        lever_swap_limit_amount: leverSwapLimitAmount,
        lever_swap_weights: adjustedWeights,
        withdraw_swap: [],
        withdraw_swap_limit_amount: ZERO_BI.value,
        withdraw_swap_weights: [],
        close_position: false,
      };
      console.error(
        'DecreaseLever params:',
        safeStringify({
          ...decreaseLeverParams,
          sub_margin: decreaseLeverParams.sub_margin.toString(),
          lever_swap_limit_amount:
            decreaseLeverParams.lever_swap_limit_amount.toString(),
          lever_swap_weights: decreaseLeverParams.lever_swap_weights.map((w) =>
            w.toString()
          ),
          withdraw_swap_limit_amount:
            decreaseLeverParams.withdraw_swap_limit_amount.toString(),
          lever_swap: decreaseLeverParams.lever_swap,
        })
      );
      modifyLeverCall =
        await multiplyContractForTx.populateTransaction.modify_lever({
          action: new CairoCustomEnum({
            DecreaseLever: decreaseLeverParams,
          }),
        });
    }
    console.error(
      'modifyLeverCall calldata length:',
      modifyLeverCall.calldata?.length || 0
    );

    // Step 3: Revoke delegation (set to false)
    const revokeDelegationCall =
      await poolContractForTx.populateTransaction.modify_delegation(
        MULTIPLY_CONTRACT_ADDRESS,
        false
      );

    const calls = [modifyDelegationCall, modifyLeverCall, revokeDelegationCall];
    console.error('=== buildUpdateMultiplyCalls END ===');
    console.error(
      'Returning calls:',
      calls.map((c, idx) => ({
        index: idx,
        contractAddress: c.contractAddress,
        entrypoint: c.entrypoint,
        calldataLength: c.calldata?.length || 0,
      }))
    );
    return calls;
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
