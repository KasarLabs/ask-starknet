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
  console.error('=== calculateEkuboWeights START ===');
  console.error(
    'ekuboQuote.totalCalculated:',
    ekuboQuote.totalCalculated.toString()
  );
  console.error('ekuboQuote.splits.length:', ekuboQuote.splits.length);

  const weights = ekuboQuote.splits.map((split, index) => {
    const weight =
      (split.amountCalculated * 10n ** BigInt(DEFAULT_DECIMALS)) /
      ekuboQuote.totalCalculated;
    console.error(
      `split[${index}]: amountCalculated=${split.amountCalculated.toString()}, weight=${weight.toString()}`
    );
    return weight;
  });

  const sum = weights.reduce((s, w) => s + w, 0n);
  console.error('weights sum:', sum.toString());
  console.error('=== calculateEkuboWeights END ===');
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
  console.error('=== calculateEkuboLeverSwapData START ===');
  console.error('token0:', safeStringify(token0));
  console.error('quotedAmount:', {
    value: quotedAmount.value.toString(),
    decimals: quotedAmount.decimals,
  });
  console.error('ekuboQuote.type:', ekuboQuote.type);
  console.error(
    'ekuboQuote.totalCalculated:',
    ekuboQuote.totalCalculated.toString()
  );
  console.error('ekuboQuote.splits.length:', ekuboQuote.splits.length);
  console.error(
    'weights:',
    weights.map((w) => w.toString())
  );

  const ZERO_BI: BigIntValue = { value: 0n, decimals: DEFAULT_DECIMALS };

  const result = ekuboQuote.splits.map((split, index) => {
    const weight = weights[index] || ZERO_BI.value;
    const amount =
      (quotedAmount.value * weight) / 10n ** BigInt(DEFAULT_DECIMALS);
    console.error(
      `split[${index}]: weight=${weight.toString()}, amount=${amount.toString()}`
    );

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
  console.error('=== calculateEkuboLeverSwapData END ===');
  console.error('result:', safeStringify(result));
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
  console.error('=== applySlippageToEkuboLimitAmount START ===');
  console.error('limitAmount:', limitAmount.toString());
  console.error('ekuboQuoteType:', ekuboQuoteType);
  console.error('slippage:', {
    value: slippage.value.toString(),
    decimals: slippage.decimals,
  });

  const ONE_BI: BigIntValue = {
    value: 10n ** BigInt(DEFAULT_DECIMALS), // 1e18
    decimals: DEFAULT_DECIMALS, // 18
  };

  const fixedSlippage =
    slippage.value * 10n ** BigInt(ONE_BI.decimals - slippage.decimals);
  console.error('fixedSlippage:', fixedSlippage.toString());

  const fixedSlippageMul =
    ekuboQuoteType === 'exactOut'
      ? ONE_BI.value + fixedSlippage
      : ONE_BI.value - fixedSlippage;
  console.error('fixedSlippageMul:', fixedSlippageMul.toString());

  let adjusted = (limitAmount * fixedSlippageMul) / ONE_BI.value;
  console.error('adjusted (before abs):', adjusted.toString());

  if (adjusted < 0n) {
    adjusted = -adjusted;
    console.error('adjusted (after abs):', adjusted.toString());
  }

  console.error('=== applySlippageToEkuboLimitAmount END ===');
  console.error('returning:', adjusted.toString());
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
  console.error('=== adjustEkuboWeights START ===');
  console.error(
    'weights input:',
    weights.map((w) => w.toString())
  );

  if (weights.length === 0) return [];

  const TARGET_SUM = 10n ** BigInt(DEFAULT_DECIMALS); // 10^18
  console.error('TARGET_SUM:', TARGET_SUM.toString());

  // Calculate current sum
  const currentSum = weights.reduce((sum, weight) => sum + weight, 0n);
  console.error('currentSum:', currentSum.toString());

  // If sum is already correct, return as-is
  if (currentSum === TARGET_SUM) {
    console.error('Weights already sum to TARGET_SUM, returning as-is');
    return weights;
  }

  // Otherwise, adjust the last weight to make the sum exact
  const adjustedWeights = [...weights];
  const lastIndex = adjustedWeights.length - 1;
  const difference = TARGET_SUM - currentSum;
  console.error('difference:', difference.toString());
  console.error('lastIndex:', lastIndex);
  console.error(
    'lastWeight before adjustment:',
    adjustedWeights[lastIndex].toString()
  );

  // Adjust the last weight to compensate for the difference
  adjustedWeights[lastIndex] = adjustedWeights[lastIndex] + difference;
  console.error(
    'lastWeight after adjustment:',
    adjustedWeights[lastIndex].toString()
  );

  if (adjustedWeights[lastIndex] < 0n) {
    throw new Error(
      `Cannot normalize weights: adjustment would result in negative weight (${adjustedWeights[lastIndex]})`
    );
  }

  // Verify the sum is now correct
  const newSum = adjustedWeights.reduce((sum, weight) => sum + weight, 0n);
  console.error('newSum:', newSum.toString());
  if (newSum !== TARGET_SUM) {
    throw new Error(
      `Failed to normalize weights: sum is ${newSum}, expected ${TARGET_SUM}`
    );
  }

  console.error('=== adjustEkuboWeights END ===');
  console.error(
    'adjustedWeights:',
    adjustedWeights.map((w) => w.toString())
  );
  return adjustedWeights;
};

// Re-export getEkuboQuote functions
export { getEkuboQuoteFromAPI } from './getEkuboQuote.js';
