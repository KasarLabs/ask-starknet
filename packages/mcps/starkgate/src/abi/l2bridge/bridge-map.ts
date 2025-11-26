import { BRIDGE_L2_ETH_TO_ETHEREUM_ABI } from './bridge-eth.abi.js';
import { BRIDGE_L2_USDC_TO_ETHEREUM_ABI } from './bridge-usdc.abi.js';
import { BRIDGE_L2_USDT_TO_ETHEREUM_ABI } from './bridge-usdt.abi.js';
import { BRIDGE_L2_WBTC_TO_ETHEREUM_ABI } from './bridge-wbtc.abi.js';
import { BRIDGE_L2_DAI_TO_ETHEREUM_ABI } from './bridge-dai.abi.js';
import { BRIDGE_L2_STRK_TO_ETHEREUM_ABI } from './bridge-strk.abi.js';
import { BRIDGE_L2_SWSS_TO_ETHEREUM_ABI } from './bridge-swss.abi.js';
import { BRIDGE_L2_LORDS_TO_ETHEREUM_ABI } from './bridge-lords.abi.js';

export const L2_BRIDGE_ABI_MAP = {
  ETH: BRIDGE_L2_ETH_TO_ETHEREUM_ABI,
  USDC: BRIDGE_L2_USDC_TO_ETHEREUM_ABI,
  USDT: BRIDGE_L2_USDT_TO_ETHEREUM_ABI,
  WBTC: BRIDGE_L2_WBTC_TO_ETHEREUM_ABI,
  DAI: BRIDGE_L2_DAI_TO_ETHEREUM_ABI,
  STRK: BRIDGE_L2_STRK_TO_ETHEREUM_ABI,
  SWSS: BRIDGE_L2_SWSS_TO_ETHEREUM_ABI,
  LORDS: BRIDGE_L2_LORDS_TO_ETHEREUM_ABI,
};

export type L2BridgeToken = keyof typeof L2_BRIDGE_ABI_MAP;
