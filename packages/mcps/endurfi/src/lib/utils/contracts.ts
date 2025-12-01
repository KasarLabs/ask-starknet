import { Account, Contract, RpcProvider } from 'starknet';
import { TOKEN_CONFIG } from '../constants/tokenConfig.js';
import {
  WITHDRAW_QUEUE_ABI,
  XSTRK_ABI,
  NEW_ERC20_ABI,
} from '../constants/abis/index.js';
import { TokenType } from '../../schemas/index.js';
import { TokenConfig } from '../../interfaces/index.js';

// Determine network from RPC URL
export const getNetwork = (provider: RpcProvider): 'mainnet' | 'sepolia' => {
  const nodeUrl = provider.channel.nodeUrl;
  return nodeUrl.includes('sepolia') ? 'sepolia' : 'mainnet';
};

/**
 * Get token configuration for a specific token type
 */
export function getTokenConfig(tokenType: TokenType): TokenConfig {
  return TOKEN_CONFIG[tokenType];
}

/**
 * Get the underlying token address (STRK, WBTC, etc.) for a network
 */
export function getUnderlyingTokenAddress(
  tokenType: TokenType,
  network: 'mainnet' | 'sepolia'
): string {
  const config = getTokenConfig(tokenType);
  const address = config.underlyingToken[network];

  if (!address) {
    throw new Error(
      `Underlying token address not configured for ${tokenType} on ${network}`
    );
  }

  return address;
}

/**
 * Get the liquid staking token contract (xSTRK, xyWBTC, etc.) for a given token type
 */
export const getLiquidTokenContract = (
  provider: RpcProvider,
  tokenType: TokenType,
  account?: Account
): Contract => {
  const network = getNetwork(provider);
  const config = TOKEN_CONFIG[tokenType];
  const address = config.asset[network];

  if (!address) {
    throw new Error(`${tokenType} asset contract not available on ${network}`);
  }

  // All liquid tokens use the ERC4626 ABI (same as xSTRK)
  return new Contract({
    abi: XSTRK_ABI,
    address: address,
    providerOrAccount: account ?? provider,
  });
};

/**
 * Get the underlying token contract (STRK, WBTC, etc.) for a given token type
 */
export const getUnderlyingTokenContract = (
  account: Account,
  provider: RpcProvider,
  tokenType: TokenType
): Contract => {
  const network = getNetwork(account);
  const config = TOKEN_CONFIG[tokenType];
  const address = config.underlyingToken[network];

  if (!address) {
    throw new Error(
      `Underlying token address not configured for ${tokenType} on ${network}`
    );
  }

  return new Contract({
    abi: NEW_ERC20_ABI,
    address,
    providerOrAccount: provider,
  });
};

/**
 * Get the withdraw queue NFT contract for a given token type
 */
export const getWithdrawQueueNFTContract = (
  provider: RpcProvider,
  tokenType: TokenType,
  account?: Account
): Contract => {
  const network = getNetwork(provider);
  const config = TOKEN_CONFIG[tokenType];
  const address = config.withdrawQueue[network];

  if (!address) {
    throw new Error(
      `${tokenType} withdraw queue contract not available on ${network}`
    );
  }

  return new Contract({
    abi: WITHDRAW_QUEUE_ABI,
    address,
    providerOrAccount: account ?? provider,
  });
};

/**
 * Get the withdraw queue NFT contract address for a given token type
 */
export const getWithdrawQueueNFTAddress = (
  account: Account,
  provider: RpcProvider,
  tokenType: TokenType
): string => {
  const network = getNetwork(provider);
  const config = TOKEN_CONFIG[tokenType];
  const address = config.withdrawQueue[network];

  if (!address) {
    throw new Error(
      `${tokenType} withdraw queue contract not available on ${network}`
    );
  }

  return address;
};

/**
 * Get the decimals for a given token type
 */
export const getTokenDecimals = (tokenType: TokenType): number => {
  return TOKEN_CONFIG[tokenType].decimals;
};

/**
 * Get the liquid token name for a given token type (e.g., "xSTRK", "xyWBTC")
 */
export const getLiquidTokenName = (tokenType: TokenType): string => {
  return TOKEN_CONFIG[tokenType].liquidTokenName;
};

/**
 * Get the underlying token name for a given token type (e.g., "STRK", "WBTC")
 */
export const getUnderlyingTokenName = (tokenType: TokenType): string => {
  return TOKEN_CONFIG[tokenType].underlyingTokenName;
};
