import { parseUnits } from 'ethers';
import { STARKGATE_ADDRESSES, SupportedToken } from '../constants/index.js';
import { BridgeAddresses } from '../types/index.js';

/**
 * Get bridge addresses for a specific token and network
 */
export const getBridgeAddresses = (
  token: SupportedToken,
  network: 'MAINNET' | 'SEPOLIA'
): BridgeAddresses => {
  const addresses = STARKGATE_ADDRESSES[network]?.[token];
  if (!addresses) {
    throw new Error(
      `Token ${token} not supported on ${network}. Supported tokens: ETH, USDC (USDC only on MAINNET)`
    );
  }
  return addresses;
};

/**
 * Parse amount with proper decimals
 */
export const parseAmount = (amount: string, decimals: number = 18): bigint => {
  try {
    return parseUnits(amount, decimals);
  } catch (error) {
    throw new Error(`Invalid amount format: ${amount}`);
  }
};

/**
 * Convert Starknet address (felt) to uint256 for L1 contracts
 */
export const feltToUint256 = (feltAddress: string): bigint => {
  // Remove 0x prefix if present
  const cleanAddress = feltAddress.startsWith('0x')
    ? feltAddress.slice(2)
    : feltAddress;
  return BigInt('0x' + cleanAddress);
};

/**
 * Convert Ethereum address to uint256 for L2 contracts
 */
export const addressToUint256 = (address: string): bigint => {
  return BigInt(address);
};

/**
 * Get token decimals
 */
export const getTokenDecimals = (token: SupportedToken): number => {
  switch (token) {
    case 'ETH':
      return 18;
    case 'USDC':
      return 6;
    default:
      return 18;
  }
};

/**
 * Validate Ethereum address format
 */
export const isValidEthAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * Validate Starknet address format
 */
export const isValidStarknetAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{1,64}$/.test(address);
};
