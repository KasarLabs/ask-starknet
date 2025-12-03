// =============================================================================
// ETH Bridge Addresses
// =============================================================================
export const BRIDGE_STARKNET_TO_ETH_ETHEREUM_ADDRESS =
  '0x073314940630FD6DcDA0d772D4c972c4e0A9946bEF9DabF4ef84eDA8eF542B82';
export const BRIDGE_ETHEREUM_TO_ETH_STARKNET_ADDRESS =
  '0xae0Ee0A63A2cE6BaeEFFE56e7714FB4EFE48D419';

// =============================================================================
// USDC Bridge Addresses
// =============================================================================
export const BRIDGE_STARKNET_TO_USDC_ETHEREUM_ADDRESS =
  '0x05cd48fccbfd8aa2773fe22c217e808319ffcc1c5a6a463f7d8fa2da48218196';
export const BRIDGE_ETHEREUM_TO_USDC_STARKNET_ADDRESS =
  '0xF6080D9fbEEbcd44D89aFfBFd42F098cbFf92816';

// =============================================================================
// STRK Bridge Addresses
// =============================================================================
export const BRIDGE_STARKNET_TO_STRK_ETHEREUM_ADDRESS =
  '0x0594c1582459ea03f77deaf9eb7e3917d6994a03c13405ba42867f83d85f085d';
export const BRIDGE_ETHEREUM_TO_STRK_STARKNET_ADDRESS =
  '0xcE5485Cfb26914C5dcE00B9BAF0580364daFC7a4';

// =============================================================================
// USDT Bridge Addresses
// =============================================================================
export const BRIDGE_STARKNET_TO_USDT_ETHEREUM_ADDRESS =
  '0x074761a8d48ce002963002becc6d9c3dd8a2a05b1075d55e5967f42296f16bd0';
export const BRIDGE_ETHEREUM_TO_USDT_STARKNET_ADDRESS =
  '0xbb3400F107804DFB482565FF1Ec8D8aE66747605';

// =============================================================================
// WBTC Bridge Addresses
// =============================================================================
export const BRIDGE_STARKNET_TO_WBTC_ETHEREUM_ADDRESS =
  '0x07aeec4870975311a7396069033796b61cd66ed49d22a786cba12a8d76717302';
export const BRIDGE_ETHEREUM_TO_WBTC_STARKNET_ADDRESS =
  '0x283751A21eafBFcD52297820D27C1f1963D9b5b4';

// =============================================================================
// DAI Bridge Addresses
// =============================================================================
export const BRIDGE_STARKNET_TO_DAI_ETHEREUM_ADDRESS =
  '0x075ac198e734e289a6892baa8dd14b21095f13bf8401900f5349d5569c3f6e60';
export const BRIDGE_ETHEREUM_TO_DAI_STARKNET_ADDRESS =
  '0x9f96fe0633ee838d0298e8b8980e6716be81388d';

// =============================================================================
// LORDS Bridge Addresses
// =============================================================================
export const BRIDGE_STARKNET_TO_LORDS_ETHEREUM_ADDRESS =
  '0x7c76a71952ce3acd1f953fd2a3fda8564408b821ff367041c89f44526076633';
export const BRIDGE_ETHEREUM_TO_LORDS_STARKNET_ADDRESS =
  '0x023A2aAc5d0fa69E3243994672822BA43E34E5C9';

// =============================================================================
// SWSS Bridge Addresses
// =============================================================================
export const BRIDGE_STARKNET_TO_SWSS_ETHEREUM_ADDRESS =
  '0x0088eedbe2fe3918b69ccb411713b7fa72079d4eddf291103ccbe41e78a9615c';
export const BRIDGE_ETHEREUM_TO_SWSS_STARKNET_ADDRESS =
  '0xbf67f59d2988a46fbff7ed79a621778a3cd3985b';

// =============================================================================
// Bridge Address Maps
// =============================================================================

/**
 * Map of Starknet bridge addresses by token symbol
 * These are L2 bridge contract addresses on Starknet
 */
export const STARKNET_BRIDGE_ADDRESS_MAP: Record<string, string> = {
  ETH: BRIDGE_STARKNET_TO_ETH_ETHEREUM_ADDRESS,
  USDC: BRIDGE_STARKNET_TO_USDC_ETHEREUM_ADDRESS,
  STRK: BRIDGE_STARKNET_TO_STRK_ETHEREUM_ADDRESS,
  USDT: BRIDGE_STARKNET_TO_USDT_ETHEREUM_ADDRESS,
  WBTC: BRIDGE_STARKNET_TO_WBTC_ETHEREUM_ADDRESS,
  SWSS: BRIDGE_STARKNET_TO_SWSS_ETHEREUM_ADDRESS,
};

/**
 * Map of Ethereum bridge addresses by token symbol
 * These are L1 bridge contract addresses on Ethereum
 */
export const ETHEREUM_BRIDGE_ADDRESS_MAP: Record<string, string> = {
  ETH: BRIDGE_ETHEREUM_TO_ETH_STARKNET_ADDRESS,
  USDC: BRIDGE_ETHEREUM_TO_USDC_STARKNET_ADDRESS,
  STRK: BRIDGE_ETHEREUM_TO_STRK_STARKNET_ADDRESS,
  USDT: BRIDGE_ETHEREUM_TO_USDT_STARKNET_ADDRESS,
  WBTC: BRIDGE_ETHEREUM_TO_WBTC_STARKNET_ADDRESS,
  SWSS: BRIDGE_ETHEREUM_TO_SWSS_STARKNET_ADDRESS,
};
