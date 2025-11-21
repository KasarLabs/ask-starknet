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

export const EKUBO_CORE: Address =
  '0x00000005dd3D2F4429AF886cD1a3b08289DBcEa99A294197E9eB43b0e0325b4b';

export const EKUBO_ROUTER_ADDRESSES = {
  sepolia: '0x0045f933adf0607292468ad1c1dedaa74d5ad166392590e72676a34d01d7b763',
  mainnet: '0x0199741822c2dc722f6f605204f35e56dbc23bceed54818168c4c49e4fb8737e',
} as const;
