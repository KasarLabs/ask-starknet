/**
 * Builds bounds object for liquidity position (price range)
 */
export function buildBounds(lowerTick: number, upperTick: number) {
  return {
    lower: {
      mag: BigInt(Math.abs(lowerTick)),
      sign: lowerTick < 0,
    },
    upper: {
      mag: BigInt(Math.abs(upperTick)),
      sign: upperTick < 0,
    },
  };
}
