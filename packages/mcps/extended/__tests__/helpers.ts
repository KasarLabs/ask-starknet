/**
 * Helper functions for Extended MCP tests
 */

// Re-export from core
export { getDataAsRecord } from '@kasarlabs/ask-starknet-core';

/**
 * Gets data as an Array, throwing if it's not
 */
export function getDataAsArray(
  data: Record<string, any> | Array<any> | undefined
): Array<any> {
  if (!data || !Array.isArray(data)) {
    throw new Error('Expected data to be an Array');
  }
  return data;
}

/**
 * Sleep utility for waiting between operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate order quantity for approximately 1 USD value
 * Takes into account leverage multiplier (default 40x)
 * Ensures the quantity respects minimum order size requirements
 * @param currentPrice Current market price in USD
 * @param minOrderSize Optional minimum order size (defaults to 0.0001 if not provided)
 * @param leverageMultiplier Optional leverage multiplier (defaults to 40)
 * @returns Quantity string representing ~1 USD worth of base asset with leverage
 */
export function calculateQtyFor1USD(
  currentPrice: number,
  minOrderSize?: number,
  leverageMultiplier: number = 40
): string {
  if (currentPrice <= 0) {
    throw new Error('currentPrice must be greater than 0');
  }
  if (leverageMultiplier < 0) {
    throw new Error('leverageMultiplier must be greater than or equal to 0');
  }

  const targetQty = (1 * leverageMultiplier) / currentPrice;

  const minSize = minOrderSize ?? 0.0001;

  const finalQty = Math.max(targetQty, minSize);

  return finalQty.toFixed(8);
}
