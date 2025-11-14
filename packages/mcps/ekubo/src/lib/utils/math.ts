export function calculateActualPrice(
  sqrtPrice: bigint,
  token0Decimals: number,
  token1Decimals: number
): number {
  const Q128 = BigInt(2) ** BigInt(128);
  const sqrtPriceFloat = Number(sqrtPrice) / Number(Q128);
  const rawPrice = sqrtPriceFloat * sqrtPriceFloat;

  // Adjust for decimal difference (token1/token0 format)
  // Raw price is token1/token0 without decimal adjustment
  // To get human-readable price: multiply by 10^(token0_decimals - token1_decimals)
  // This converts from raw amounts to human-readable amounts
  // Example: rawPrice = 1e12, token0=6 decimals, token1=18 decimals
  // Human price = 1e12 * 10^(6-18) = 1e12 * 10^(-12) = 1
  const decimalAdjustment = 10 ** (token0Decimals - token1Decimals);
  return rawPrice * decimalAdjustment;
}

export function calculateTickFromSqrtPrice(sqrtPrice: bigint): number {
  const Q128 = BigInt(2) ** BigInt(128);
  const sqrtPriceFloat = Number(sqrtPrice) / Number(Q128);
  const price = sqrtPriceFloat * sqrtPriceFloat;
  // tick = log_base(1.000001)(price)
  return Math.floor(Math.log(price) / Math.log(1.000001));
}

/**
 * Convert a human-readable price (token1/token0) to a tick
 * @param price Human-readable price in token1/token0 format (e.g., 0.00023 means 1 token1 = 0.00023 token0)
 * @param token0Decimals Number of decimals for token0
 * @param token1Decimals Number of decimals for token1
 * @returns The tick corresponding to the price
 *
 * Formula: tick = log_base(1.0001)(rawPrice)
 * where rawPrice = price * 10^(token1_decimals - token0_decimals)
 *
 * The price is human-readable (already adjusted for decimals), so we need to convert it
 * to the raw onchain price by multiplying by the decimal adjustment factor.
 * Since price is token1/token0, we multiply by 10^(token1_decimals - token0_decimals).
 */
export function calculateTickFromPrice(
  price: number,
  token0Decimals: number,
  token1Decimals: number
): number {
  const decimalAdjustment = 10 ** (token1Decimals - token0Decimals);
  const rawPrice = price * decimalAdjustment;

  const tick = Math.log(rawPrice) / Math.log(1.000001); // 1.000001 base tick ekubo
  return Math.floor(tick);
}

/**
 * Convert fee percentage to Ekubo's internal fee representation
 * @param feePercent Fee as a percentage (e.g., 0.05 for 0.05%, 0.3 for 0.3%, 1 for 1%)
 * @returns Fee in Ekubo's u128 format as a string
 *
 * Formula: fee_u128 = (fee_percent / 100) * 2^128
 *
 * Examples:
 * - 0.05% -> "170141183460469231731687303715884105728"
 * - 0.3% -> "1020847100762815390390123822295304634368"
 * - 1% -> "3402823669209384634633746074317682114560"
 */
export function convertFeePercentToU128(feePercent: number): string {
  // Convert percentage to decimal (0.05% -> 0.0005)
  const feeDecimal = feePercent / 100;

  // Calculate fee * 2^128
  // We use BigInt for precision with large numbers
  const TWO_POW_128 = BigInt(2) ** BigInt(128);
  const feeU128 = BigInt(Math.floor(feeDecimal * Number(TWO_POW_128)));

  return feeU128.toString();
}

/**
 * Convert fee from Ekubo's u128 format back to percentage
 * @param feeU128 Fee in Ekubo's u128 format as a string
 * @returns Fee as a percentage (e.g., 0.05 for 0.05%, 0.3 for 0.3%, 1 for 1%)
 *
 * Reverse of convertFeePercentToU128
 * Formula: fee_percent = (fee_u128 / 2^128) * 100
 */
export function convertFeeU128ToPercent(feeU128: string): number {
  const TWO_POW_128 = BigInt(2) ** BigInt(128);
  const feeBigInt = BigInt(feeU128);

  // Calculate fee_decimal = fee_u128 / 2^128
  // We need to do this with proper precision
  const feeDecimal = Number(feeBigInt) / Number(TWO_POW_128);

  // Convert to percentage: fee_decimal * 100
  const feePercent = feeDecimal * 100;

  return feePercent;
}

/**
 * Convert tick spacing percentage to tick exponent
 * @param tickSpacingPercent Tick spacing as a percentage (e.g., 0.01 for 0.01%, 0.1 for 0.1%, 1 for 1%)
 * @returns Tick spacing as an integer exponent
 *
 * Formula: tick_spacing = log_base(1.000001)(1 + tick_spacing_percent / 100)
 *
 * Per Ekubo docs: "The tick spacing of 0.01% is represented as an exponent of 1.000001,
 * so it can be computed as log base 1.000001 of 1.001, which is roughly equal to 1000"
 *
 * Examples:
 * - 0.01% -> ~1000
 * - 0.05% -> ~5000
 * - 0.1% -> ~10000
 * - 1% -> ~100000
 */
export function convertTickSpacingPercentToExponent(
  tickSpacingPercent: number
): number {
  // Convert percentage to decimal (0.01% -> 0.0001)
  const spacingDecimal = tickSpacingPercent / 100;

  // Calculate log_base(1.000001)(1 + spacing_decimal)
  // log_base(a)(b) = ln(b) / ln(a)
  const tickSpacing = Math.log(1 + spacingDecimal) / Math.log(1.000001);
  return Math.round(tickSpacing);
}

/**
 * Convert tick spacing exponent back to percentage
 * @param tickSpacingExponent Tick spacing as an integer exponent (e.g., 1000, 5000, 10000)
 * @returns Tick spacing as a percentage (e.g., 0.01 for 0.01%, 0.1 for 0.1%, 1 for 1%)
 *
 * Reverse of convertTickSpacingPercentToExponent
 * Formula: tick_spacing_percent = (1.000001^exponent - 1) * 100
 *
 * Examples:
 * - 1000 -> ~0.01%
 * - 5000 -> ~0.05%
 * - 10000 -> ~0.1%
 * - 100000 -> ~1%
 */
export function convertTickSpacingExponentToPercent(
  tickSpacingExponent: number
): number {
  // Calculate 1.000001^exponent
  const base = 1.000001;
  const result = Math.pow(base, tickSpacingExponent);

  // Convert to percentage: (result - 1) * 100
  const tickSpacingPercent = (result - 1) * 100;

  return tickSpacingPercent;
}

/**
 * Round a tick to the nearest valid tick according to tick spacing
 * @param tick The tick to round
 * @param tickSpacingExponent The tick spacing exponent (from convertTickSpacingPercentToExponent)
 * @param roundDown If true, round down (for lower tick). If false, round up (for upper tick)
 * @returns The rounded tick that is a multiple of tick spacing
 *
 * In Ekubo, ticks must be multiples of the tick spacing. This function ensures
 * that the tick is valid for the pool configuration.
 *
 * For lower ticks, we round down to ensure the price remains >= lower_price
 * For upper ticks, we round up to ensure the price remains <= upper_price
 */
export function roundTickToSpacing(
  tick: number,
  tickSpacingExponent: number,
  roundDown: boolean
): number {
  // Handle edge case where tick spacing is 0 or negative
  if (tickSpacingExponent <= 0) {
    return tick;
  }

  // Calculate the quotient and ensure it's an integer
  let quotient: number;
  if (roundDown) {
    // Round down for lower tick
    quotient = Math.floor(tick / tickSpacingExponent);
  } else {
    // Round up for upper tick
    quotient = Math.ceil(tick / tickSpacingExponent);
  }

  // Multiply back to get the rounded tick, ensuring it's a multiple of tickSpacingExponent
  // Use Math.round to handle any floating point precision issues
  const roundedTick = Math.round(quotient * tickSpacingExponent);

  return roundedTick;
}
