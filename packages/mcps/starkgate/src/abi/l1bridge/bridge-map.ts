import { BRIDGE_L1_ETH_TO_STARKNET_ABI } from './bridge-eth.abi.js';
import { BRIDGE_L1_USDC_TO_STARKNET_ABII } from './bridge-usdc.abi.js';
import { BRIDGE_L1_USDT_TO_STARKNET_ABI } from './bridge-usdt.abi.js';
import { BRIDGE_L1_WBTC_TO_STARKNET_ABI } from './bridge-wbtc.abi.js';
import { BRIDGE_L1_DAI_TO_STARKNET_ABI } from './bridge-dai.abi.js';
import { BRIDGE_L1_STRK_TO_ETHEREUM_ABI } from './bridge-strk.abi.js';
import { BRIDGE_L1_SWSS_TO_STARKNET_ABI } from './bridge-swss.abi.js';
import { BRIDGE_L1_LORDS_TO_STARKNET_ABI } from './bridge-lords.abi.js';

export const L1_BRIDGE_ABI_MAP = {
  ETH: BRIDGE_L1_ETH_TO_STARKNET_ABI,
  USDC: BRIDGE_L1_USDC_TO_STARKNET_ABII,
  USDT: BRIDGE_L1_USDT_TO_STARKNET_ABI,
  WBTC: BRIDGE_L1_WBTC_TO_STARKNET_ABI,
  DAI: BRIDGE_L1_DAI_TO_STARKNET_ABI,
  STRK: BRIDGE_L1_STRK_TO_ETHEREUM_ABI,
  SWSS: BRIDGE_L1_SWSS_TO_STARKNET_ABI,
  LORDS: BRIDGE_L1_LORDS_TO_STARKNET_ABI,
} as const;

export type L1BridgeToken = keyof typeof L1_BRIDGE_ABI_MAP;
