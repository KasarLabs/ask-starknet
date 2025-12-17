import { Account, CallData, ProviderInterface, Uint256 } from 'starknet';
import {
  EKUBO_TICK_SIZE_LOG,
  EKUBO_TICK_SPACING,
  FACTORY_ADDRESS,
  TokenInfo,
  STRK_TOKEN,
  ETH_TOKEN,
  USDC_TOKEN,
} from '../constants/index.js';
import { SnakAgentInterface } from '../dependances/types.js';
import { RpcProvider } from 'starknet';
import { onchainWrite } from '@kasarlabs/ask-starknet-core';

/**
 * Execute a contract function transaction.
 *
 * ⚠️ WARNING: This function is only suitable for write operations where you don't need
 * the return value of the contract function. It only returns the transaction hash.
 *
 * For operations where you need the actual return value:
 * ```typescript
 * // Example of getting return value directly:
 * const account = new Account({ provider: rpcProvider, address: accountAddress, signer: privateKey });
 * const contract = new Contract({ abi, address: FACTORY_ADDRESS, providerOrAccount: account });
 * const result = await contract.yourFunctionName(your, params, here);
 * // Now you have access to the actual return value
 * ```
 *
 * @param method - The name of the contract function to call
 * @param publicKey - The caller's account address
 * @param privateKey - The caller's private key
 * @param calldata - The function arguments
 * @param provider - The RPC provider
 * @returns Transaction hash only
 */
export const execute = async (
  method: string,
  env: onchainWrite,
  calldata: (string | Uint256)[]
) => {
  const account = env.account;
  return await account.execute({
    contractAddress: FACTORY_ADDRESS,
    entrypoint: method,
    calldata: CallData.compile(calldata),
  });
};

/**
 * Creates a scaling factor string for token decimals by generating a "1" followed by N zeros.
 * @param decimals - The number of decimal places the token uses
 * @returns A string representing 10^decimals (e.g., "1000000" for 6 decimals)
 */
export const decimalsScale = (decimals: number) =>
  `1${Array(decimals).fill('0').join('')}`;

/**
 * Calculates the starting tick for a given initial price in an Ekubo pool.
 * @param initialPrice - The initial price (must be positive)
 * @returns The starting tick aligned to EKUBO_TICK_SPACING
 * @throws {Error} If initialPrice is not a positive number
 */
export const getStartingTick = (initialPrice: number) =>
  Math.floor(
    Math.log(initialPrice) / EKUBO_TICK_SIZE_LOG / EKUBO_TICK_SPACING
  ) * EKUBO_TICK_SPACING;

/**
 * Converts a Uint256 value from its low and high parts (hex strings) into a single bigint.
 * Uint256 is represented as two 128-bit values: low (least significant) and high (most significant).
 *
 * @param lowHex - The low 128 bits as a hexadecimal string
 * @param highHex - The high 128 bits as a hexadecimal string
 * @returns The combined 256-bit value as a bigint
 */
const uint256HexToBigInt = (lowHex: string, highHex: string): bigint => {
  try {
    const low = BigInt(lowHex);
    const high = BigInt(highHex);
    return (high << 128n) + low;
  } catch (error) {
    throw new Error(
      `Failed to convert Uint256 to bigint. Invalid hex values: low="${lowHex}", high="${highHex}"`
    );
  }
};

/**
 * Retrieves the total supply of a memecoin contract.
 *
 * @param provider - The Starknet provider instance
 * @param address - The contract address to query
 * @returns The total supply as a bigint
 * @throws {Error} If the totalSupply call fails or returns invalid data
 */
export const getMemecoinTotalSupply = async (
  provider: ProviderInterface,
  address: string
): Promise<bigint> => {
  const res = await provider.callContract({
    contractAddress: address,
    entrypoint: 'totalSupply',
    calldata: [],
  });

  const out: string[] = Array.isArray(res)
    ? res
    : Array.isArray((res as any)?.result)
      ? (res as any).result
      : [];

  if (out.length === 2) {
    return uint256HexToBigInt(out[0], out[1]);
  }

  if (out.length === 1) {
    return BigInt(out[0]);
  }

  throw new Error(
    `Invalid totalSupply response: expected Uint256 (2 values) or felt252 (1 value), got ${out.length} values`
  );
};
