import { STRK_TOKEN_ETHEREUM_ABI } from './strk-token-ethereum-abi.js';
import { USDC_TOKEN_ETHEREUM_ABI } from './usdc-token-ethereum-abi.js';
import { USDT_TOKEN_ETHEREUM_ABI } from './usdt-token-ethereum-abi.js';
import { WBTC_TOKEN_ETHEREUM_ABI } from './wbtc-token-ethereum-abi.js';
import { SWSS_TOKEN_ETHEREUM_ABI } from './swss-token-ethereum-abi.js';

export type EthereumTokenSymbol = 'STRK' | 'USDC' | 'USDT' | 'WBTC' | 'SWSS';

export const ETHEREUM_TOKEN_ABI_MAP: Record<
  EthereumTokenSymbol,
  readonly any[]
> = {
  STRK: STRK_TOKEN_ETHEREUM_ABI,
  USDC: USDC_TOKEN_ETHEREUM_ABI,
  USDT: USDT_TOKEN_ETHEREUM_ABI,
  WBTC: WBTC_TOKEN_ETHEREUM_ABI,
  SWSS: SWSS_TOKEN_ETHEREUM_ABI,
} as const;

/**
 * Get Ethereum token ABI by symbol
 * @param symbol - Token symbol (ETH, STRK, USDC, USDT, WBTC, SWSS)
 * @returns Token ABI array
 * @throws Error if token symbol is not found
 */
export function getEthereumTokenAbi(
  symbol: EthereumTokenSymbol
): readonly any[] {
  const abi = ETHEREUM_TOKEN_ABI_MAP[symbol];
  if (!abi) {
    throw new Error(`Ethereum token ABI not found for symbol: ${symbol}`);
  }
  return abi;
}
