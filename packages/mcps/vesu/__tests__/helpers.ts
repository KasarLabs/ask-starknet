/**
 * Normalizes an address by padding it to 64 hex characters (66 with 0x prefix)
 * This ensures addresses are compared in a consistent format regardless of their original length
 * @param addr - Address to normalize
 * @returns Normalized address in lowercase
 */
export function normalizeAddress(addr: string): string {
  const withoutPrefix = addr.startsWith('0x') ? addr.slice(2) : addr;
  const padded = withoutPrefix.padStart(64, '0');
  return `0x${padded}`.toLowerCase();
}

/**
 * Verifies that an LTV value is within ±1% tolerance of the expected value
 * Handles both decimal format (0-1) and percentage format (0-100)
 * @param actualLTV - The actual LTV value (as string or number, can be decimal 0-1 or percentage 0-100)
 * @param expectedLTV - The expected LTV value in percentage format (as string or number, 0-100)
 * @returns true if the LTV is within tolerance, throws error otherwise
 */
export function expectLTVWithinTolerance(
  actualLTV: string | number,
  expectedLTV: string | number
): void {
  let actual: number;
  if (typeof actualLTV === 'string') {
    actual = parseFloat(actualLTV);
  } else {
    actual = actualLTV;
  }

  const expected =
    typeof expectedLTV === 'string' ? parseInt(expectedLTV) : expectedLTV;

  // Convert actual LTV to percentage if it's in decimal format (0-1)
  // If actual is between 0 and 1, it's in decimal format, convert to percentage
  if (actual >= 0 && actual <= 1) {
    actual = actual * 100;
  }

  const minLTV = expected - 1;
  const maxLTV = expected + 1;

  if (actual < minLTV || actual > maxLTV) {
    throw new Error(
      `LTV ${actual}% is not within ±1% tolerance of expected ${expected}% (expected range: ${minLTV}%-${maxLTV}%)`
    );
  }
}
