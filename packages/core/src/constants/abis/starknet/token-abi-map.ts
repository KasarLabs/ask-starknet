import { ETH_TOKEN_STARKNET_ABI } from './eth-token-starknet-abi.js';
import { STRK_TOKEN_STARKNET_ABI } from './strk-token-starknet-abi.js';
import { USDC_TOKEN_STARKNET_ABI } from './usdc-token-starknet-abi.js';
import { USDT_TOKEN_STARKNET_ABI } from './usdt-token-starknet-abi.js';
import { WBTC_TOKEN_STARKNET_ABI } from './wbtc-token-starknet-abi.js';
import { SWSS_TOKEN_STARKNET_ABI } from './swss-token-starknet-abi.js';

export type StarknetTokenSymbol = 'ETH' | 'STRK' | 'USDC' | 'USDT' | 'WBTC' | 'SWSS';

export const STARKNET_TOKEN_ABI_MAP: Record<StarknetTokenSymbol, readonly any[]> = {
  ETH: ETH_TOKEN_STARKNET_ABI,
  STRK: STRK_TOKEN_STARKNET_ABI,
  USDC: USDC_TOKEN_STARKNET_ABI,
  USDT: USDT_TOKEN_STARKNET_ABI,
  WBTC: WBTC_TOKEN_STARKNET_ABI,
  SWSS: SWSS_TOKEN_STARKNET_ABI,
} as const;

/**
 * Get Starknet token ABI by symbol
 * @param symbol - Token symbol (ETH, STRK, USDC, USDT, WBTC, SWSS)
 * @returns Token ABI array
 * @throws Error if token symbol is not found
 */
export function getStarknetTokenAbi(symbol: StarknetTokenSymbol): readonly any[] {
  const abi = STARKNET_TOKEN_ABI_MAP[symbol];
  if (!abi) {
    throw new Error(`Starknet token ABI not found for symbol: ${symbol}`);
  }
  return abi;
}
