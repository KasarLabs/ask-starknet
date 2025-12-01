import { WAD } from '../constants/index.js';

export type ResultWad = {
  netValueWad: bigint; // N (WAD)
  targetLtvWad: bigint; // T (WAD, 0 <= T < 1e18)
  newDebtWad: bigint; // D (WAD)
  newCollateralWad: bigint; // C (WAD)
  deltaDebtWad?: bigint; // D - currentDebtWad (if currentDebtWad provided)
};

export function computeCandD_from_T_and_N_wad(
  netValueWad: bigint,
  targetLtvWad: bigint,
  currentDebtWad?: bigint
): ResultWad {
  if (netValueWad <= 0n) throw new Error('netValueWad must be > 0');
  if (targetLtvWad < 0n || targetLtvWad >= WAD) {
    throw new Error('targetLtvWad must satisfy 0 <= T < 1e18 (WAD)');
  }

  const denom = WAD - targetLtvWad;

  const newDebtWad = (targetLtvWad * netValueWad) / denom;
  const newCollateralWad = netValueWad + newDebtWad;

  const res: ResultWad = {
    netValueWad,
    targetLtvWad,
    newDebtWad,
    newCollateralWad,
  };

  if (currentDebtWad !== undefined) {
    res.deltaDebtWad = currentDebtWad - newDebtWad;
  }

  return res;
}
