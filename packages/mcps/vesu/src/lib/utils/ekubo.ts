import { cairo } from 'starknet';
import { DEFAULT_DECIMALS } from '../constants/index.js';
import type { IBaseToken } from '../../interfaces/index.js';

/**
 * Ekubo pool key structure
 */
export type EkuboPoolKey = {
  token0: string;
  token1: string;
  fee: bigint;
  tickSpacing: bigint;
  extension: string;
};

/**
 * Ekubo route structure
 */
export type EkuboRoute = {
  poolKey: EkuboPoolKey;
  sqrtRatioLimit: bigint;
  skipAhead: bigint;
};

/**
 * Ekubo split structure
 */
export type EkuboSplit = {
  amountSpecified: bigint;
  amountCalculated: bigint;
  route: EkuboRoute[];
};

/**
 * Ekubo quote type
 */
export type EkuboQuoteType = 'exactIn' | 'exactOut';

/**
 * Ekubo quote structure
 */
export type EkuboQuote = {
  type: EkuboQuoteType;
  splits: EkuboSplit[];
  totalCalculated: bigint;
  priceImpact: number | null;
  error?: string;
};

/**
 * Token value with decimals
 */
export interface BigIntValue {
  value: bigint;
  decimals: number;
}

/**
 * Calculate Ekubo weights from quote splits
 */
export const calculateEkuboWeights = (ekuboQuote: EkuboQuote): bigint[] => {
  const weights = ekuboQuote.splits.map((split, index) => {
    const weight =
      (split.amountCalculated * 10n ** BigInt(DEFAULT_DECIMALS)) /
      ekuboQuote.totalCalculated;
    return weight;
  });

  return weights;
};

/**
 * Calculate Ekubo lever swap data
 */
export const calculateEkuboLeverSwapData = (
  token0: IBaseToken,
  quotedAmount: BigIntValue,
  ekuboQuote: EkuboQuote,
  weights: bigint[]
) => {
  const ZERO_BI: BigIntValue = { value: 0n, decimals: DEFAULT_DECIMALS };

  const result = ekuboQuote.splits.map((split, index) => {
    const weight = weights[index] || ZERO_BI.value;
    const amount =
      (quotedAmount.value * weight) / 10n ** BigInt(DEFAULT_DECIMALS);

    return {
      token_amount: {
        token: token0.address,
        amount: {
          mag: amount,
          sign: ekuboQuote.type === 'exactOut' ? true : false,
        },
      },
      route: split.route.map((route) => ({
        pool_key: {
          extension: route.poolKey.extension,
          token0: route.poolKey.token0,
          token1: route.poolKey.token1,
          fee: route.poolKey.fee,
          tick_spacing: route.poolKey.tickSpacing,
        },
        sqrt_ratio_limit: route.sqrtRatioLimit,
        skip_ahead: route.skipAhead,
      })),
    };
  });
  return result;
};

/**
 * Apply slippage to Ekubo limit amount
 */
export const applySlippageToEkuboLimitAmount = (
  limitAmount: bigint,
  ekuboQuoteType: EkuboQuoteType,
  slippage: BigIntValue
): bigint => {
  const ONE_BI: BigIntValue = {
    value: 10n ** BigInt(DEFAULT_DECIMALS), // 1e18
    decimals: DEFAULT_DECIMALS, // 18
  };

  const fixedSlippage =
    slippage.value * 10n ** BigInt(ONE_BI.decimals - slippage.decimals);

  const fixedSlippageMul =
    ekuboQuoteType === 'exactOut'
      ? ONE_BI.value + fixedSlippage
      : ONE_BI.value - fixedSlippage;

  let adjusted = (limitAmount * fixedSlippageMul) / ONE_BI.value;

  if (adjusted < 0n) {
    adjusted = -adjusted;
  }

  return adjusted;
};

export function safeStringify(obj: any) {
  return JSON.stringify(
    obj,
    (_, value) => (typeof value === 'bigint' ? value.toString() : value),
    2
  );
}
/**
 * Adjust Ekubo weights for DecreaseLever operations
 * This function normalizes weights to ensure they sum exactly to 10^18
 * Due to rounding errors in division, the sum might not be exactly 10^18,
 * so we adjust the last weight to make the sum exact
 */
export const adjustEkuboWeights = (weights: bigint[]): bigint[] => {
  if (weights.length === 0) return [];

  const TARGET_SUM = 10n ** BigInt(DEFAULT_DECIMALS); // 10^18

  const currentSum = weights.reduce((sum, weight) => sum + weight, 0n);

  if (currentSum === TARGET_SUM) {
    return weights;
  }

  const adjustedWeights = [...weights];
  const lastIndex = adjustedWeights.length - 1;
  const difference = TARGET_SUM - currentSum;

  adjustedWeights[lastIndex] = adjustedWeights[lastIndex] + difference;

  if (adjustedWeights[lastIndex] < 0n) {
    throw new Error(
      `Cannot normalize weights: adjustment would result in negative weight (${adjustedWeights[lastIndex]})`
    );
  }

  const newSum = adjustedWeights.reduce((sum, weight) => sum + weight, 0n);
  if (newSum !== TARGET_SUM) {
    throw new Error(
      `Failed to normalize weights: sum is ${newSum}, expected ${TARGET_SUM}`
    );
  }

  return adjustedWeights;
};

// Re-export getEkuboQuote functions
export { getEkuboQuoteFromAPI } from './getEkuboQuote.js';
