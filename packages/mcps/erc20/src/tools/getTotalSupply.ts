import { RpcProvider, uint256 } from 'starknet';
import { onchainRead, onchainWrite } from '@kasarlabs/ask-starknet-core';
import {
  validateToken,
  formatBalance,
  uint256HexToBigInt,
} from '../lib/utils/utils.js';
import { validToken } from '../lib/types/types.js';
import { z } from 'zod';
import { getTotalSupplySchema } from '../schemas/index.js';

/**
 * Calls the totalSupply function on a contract, trying multiple known entrypoint names.
 * Different ERC-20 implementations may use different naming conventions for the same function.
 *
 * @param provider - The Starknet RPC provider instance
 * @param address - The contract address to query
 * @returns The total supply as a bigint
 * @throws {Error} If none of the entrypoints are found or readable
 */
export async function callTotalSupplyRaw(
  provider: RpcProvider,
  address: string
): Promise<bigint> {
  const entrypoints: Array<
    'totalSupply' | 'total_supply' | 'get_total_supply'
  > = ['totalSupply', 'total_supply', 'get_total_supply'];

  let lastErr: unknown = null;

  for (const entrypoint of entrypoints) {
    try {
      const res = await provider.callContract(
        { contractAddress: address, entrypoint, calldata: [] },
        'latest'
      );

      // callContract returns either { result: string[] } or string[]
      const out: string[] = Array.isArray(res)
        ? res
        : Array.isArray((res as any)?.result)
          ? (res as any).result
          : [];

      if (out.length >= 2) {
        return uint256HexToBigInt(out[0], out[1]);
      }

      // If we get a single value, this is non-standard and likely an error
      // Starknet ERC-20 totalSupply must return Uint256 (low, high pair)
      if (out.length === 1) {
        throw new Error(
          `Invalid totalSupply response: expected Uint256 (2 values), got 1 value. ` +
            `This may indicate a malformed contract response or non-standard implementation.`
        );
      }
    } catch (e) {
      lastErr = e;
    }
  }

  // All entrypoints failed - throw an error with context
  throw new Error(
    `totalSupply not found or unreadable on ${address} ` +
      (lastErr instanceof Error ? `(${lastErr.message})` : '')
  );
}

/**
 * Retrieves the total supply of an ERC-20 token on Starknet.
 *
 * This function validates the token contract, queries its total supply using multiple
 * entrypoint name variations, and returns the result formatted according to the token's decimals.
 *
 * @param env - The onchain read environment containing the RPC provider
 * @param params - Parameters containing the asset address to query
 * @returns A promise resolving to an object with:
 *   - status: 'success' or 'failure'
 *   - totalSupply: The formatted total supply string (if successful)
 *   - error: Error message (if failed)
 */
export const getTotalSupply = async (
  env: onchainRead,
  params: z.infer<typeof getTotalSupplySchema>
) => {
  try {
    const provider = env.provider;

    const token: validToken = await validateToken(
      provider,
      params.assetAddress
    );

    const totalSupply = await callTotalSupplyRaw(provider, token.address);

    const formattedSupply = formatBalance(totalSupply, token.decimals);

    return {
      status: 'success',
      totalSupply: formattedSupply,
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
