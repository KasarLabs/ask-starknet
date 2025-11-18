import { cairo, Contract } from 'starknet';

/**
 * Fetches a swap quote from the Ekubo Router
 */
export async function getSwapQuote(
  routerContract: Contract,
  routeNode: any,
  tokenAmount: any
) {
  return await routerContract.quote_swap(routeNode, tokenAmount);
}

/**
 * Extracts expected output amount from quote based on swap direction
 */
export function extractExpectedOutput(
  quote: any,
  isTokenALower: boolean
): bigint {
  // If selling token0 (lower), receive token1
  // If selling token1 (higher), receive token0
  return isTokenALower ? quote.amount1.mag : quote.amount0.mag;
}

/**
 * Calculates minimum output amount with slippage tolerance
 */
export function calculateMinimumOutput(
  expectedOutput: bigint,
  slippageTolerance: number
): string {
  const slippageMultiplier = 1 - slippageTolerance / 100;
  const minimumAmount = BigInt(
    Math.floor(Number(expectedOutput) * slippageMultiplier)
  );
  return minimumAmount.toString();
}

/**
 * Calculates minimum output with slippage and returns cairo.uint256 format
 */
export function calculateMinimumOutputU256(
  expectedOutput: bigint,
  slippageTolerance: number
) {
  const minimumAmountStr = calculateMinimumOutput(
    expectedOutput,
    slippageTolerance
  );
  return cairo.uint256(minimumAmountStr);
}

/**
 * Extracts the required input amount from a quote for exact output swaps
 *
 * @param quote - The quote response from Ekubo router
 * @param isTokenInToken0 - Whether the input token is token0 in the pool
 * @returns The required input amount as a positive bigint
 *
 * @remarks
 * In Ekubo's quote response for exact output swaps:
 * - The output amount has sign=true (negative), representing tokens being received
 * - The input amount has sign=false (positive), representing tokens being spent
 *
 * This function extracts the correct input amount based on which token is being sold.
 */
export function extractRequiredInput(
  quote: any,
  isTokenInToken0: boolean
): bigint {
  const amount0 = BigInt(quote.amount0.mag.toString());
  const amount1 = BigInt(quote.amount1.mag.toString());
  const sign0 = quote.amount0.sign;
  const sign1 = quote.amount1.sign;

  let requiredInput: bigint;

  if (isTokenInToken0) {
    // tokenIn is token0, so amount0 is the input we need to provide
    // If sign0 is true (negative), it means it's actually an output, so we negate to get absolute value
    // If sign0 is false (positive), it's already the input amount
    requiredInput = sign0 ? -amount0 : amount0;
  } else {
    // tokenIn is token1, so amount1 is the input we need to provide
    requiredInput = sign1 ? -amount1 : amount1;
  }

  // Safety check: ensure it's positive (absolute value)
  // This handles edge cases where the logic might produce negative values
  if (requiredInput < 0n) {
    requiredInput = -requiredInput;
  }

  return requiredInput;
}

/**
 * Creates minimum output amount for exact output swaps
 *
 * @param desiredOutput - The exact output amount requested by the user
 * @returns cairo.uint256 formatted output amount
 *
 * @remarks
 * For exact output swaps, the user wants to receive EXACTLY the specified amount.
 * Therefore, the minimum output should equal the desired output (no slippage reduction).
 * Slippage protection is handled separately by sqrtRatioLimit, which prevents
 * paying excessive input amounts.
 */
export function createExactOutputMinimum(desiredOutput: bigint) {
  return cairo.uint256(desiredOutput.toString());
}
