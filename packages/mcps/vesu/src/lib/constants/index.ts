import { BigDecimal } from '../../interfaces/index.js';
import type { Address } from '../../interfaces/index.js';

export const GENESIS_POOLID =
  '0x0451fe483d5921a2919ddd81d0de6696669bccdacd859f72a4fba7656b97c3b5';

export const VESU_API_URL = 'https://staging.api.vesu.xyz';

export const DEFAULT_DECIMALS = 18;

export const ZERO: BigDecimal = { value: 0n, decimals: 0 };

// Multiply contract address
export const MULTIPLY_CONTRACT_ADDRESS: Address =
  '0x7964760e90baa28841ec94714151e03fbc13321797e68a874e88f27c9d58513';
