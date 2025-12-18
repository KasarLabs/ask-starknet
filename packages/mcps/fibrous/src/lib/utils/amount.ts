import { BigNumber } from '@ethersproject/bignumber';

/**
 * Converts a human-readable token amount to base units (wei-like).
 * Handles decimals by padding/truncating the fractional part.
 *
 * @param amount - The amount in human-readable format (e.g., "1.5" or 1.5)
 * @param decimals - The token's decimal places (e.g., 18 for ETH)
 * @returns The amount in base units as a string
 */
export function formatToBaseUnits(
  amount: number | string | BigNumber,
  decimals: number
): string {
  if (BigNumber.isBigNumber(amount)) {
    return amount.toString();
  }

  const value = amount.toString();
  const [whole, fraction = ''] = value.split('.');
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
  const combined = `${whole}${paddedFraction}`;
  return combined.replace(/^(-?)0+(?=\d)/, '$1') || '0';
}
