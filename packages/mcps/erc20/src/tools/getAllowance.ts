import { RpcProvider, validateAndParseAddress } from 'starknet';
import { onchainRead, onchainWrite } from '@kasarlabs/ask-starknet-core';
import {
  formatBalance,
  validateToken,
  uint256HexToBigInt,
} from '../lib/utils/utils.js';
import { z } from 'zod';
import {
  getAllowanceSchema,
  getMyGivenAllowanceSchema,
  getAllowanceGivenToMeSchema,
} from '../schemas/index.js';

/**
 * Reads the allowance value from a token contract by trying common entrypoint names.
 *
 * This function attempts multiple entrypoint variants to ensure compatibility with
 * different ERC-20 token implementations on Starknet. It handles both standard
 * Uint256 responses (as [low, high] pairs) and single felt responses.
 *
 * @param provider - The Starknet RPC provider instance
 * @param tokenAddress - The address of the ERC-20 token contract
 * @param ownerAddress - The address of the token owner
 * @param spenderAddress - The address of the spender (allowed to spend tokens)
 * @returns The raw allowance value as a bigint
 * @throws {Error} If all entrypoint attempts fail
 */
async function readAllowanceRaw(
  provider: RpcProvider,
  tokenAddress: string,
  ownerAddress: string,
  spenderAddress: string
): Promise<bigint> {
  const contractAddress = validateAndParseAddress(tokenAddress);
  const owner = validateAndParseAddress(ownerAddress);
  const spender = validateAndParseAddress(spenderAddress);

  const entrypoints: Array<'allowance' | 'get_allowance'> = [
    'allowance',
    'get_allowance',
  ];

  let lastErr: unknown = null;

  for (const entrypoint of entrypoints) {
    try {
      const res = await provider.callContract({
        contractAddress,
        entrypoint,
        calldata: [owner, spender],
      });

      const out: string[] = Array.isArray((res as any)?.result)
        ? (res as any).result
        : Array.isArray(res)
          ? (res as any)
          : [];

      if (out.length >= 2) return uint256HexToBigInt(out[0], out[1]);

      // Rare case: some implementations return a single felt value
      if (out.length === 1) return BigInt(out[0]);
    } catch (e) {
      lastErr = e;
    }
  }

  throw new Error(
    `Failed to read allowance on ${contractAddress} for owner ${owner} and spender ${spender}` +
      (lastErr instanceof Error ? ` (last error: ${lastErr.message})` : '')
  );
}

/**
 * Gets the amount of tokens that a spender is allowed to use on behalf of an owner.
 *
 * This function queries the ERC-20 token contract to retrieve the allowance value,
 * which represents how many tokens the owner has authorized the spender to transfer.
 * The result is returned in a human-readable format based on the token's decimals.
 *
 * @param env - The onchain read environment containing the provider
 * @param params - Parameters object containing:
 *   - assetAddress: The address of the ERC-20 token contract
 *   - ownerAddress: The address of the token owner
 *   - spenderAddress: The address of the spender to check allowance for
 * @returns A promise that resolves to an object with:
 *   - status: "success" or "failure"
 *   - owner: The owner address (on success)
 *   - spender: The spender address (on success)
 *   - allowance: The formatted allowance amount as a string (on success)
 *   - error: Error message (on failure)
 */
export const getAllowance = async (
  env: onchainRead,
  params: z.infer<typeof getAllowanceSchema>
) => {
  try {
    const provider = env.provider;
    const token = await validateToken(provider, params.asset.assetAddress, params.asset.assetSymbol);

    const raw = await readAllowanceRaw(
      provider,
      token.address,
      params.ownerAddress,
      params.spenderAddress
    );
    const formatted = formatBalance(raw, token.decimals);

    return {
      status: 'success',
      owner: params.ownerAddress,
      spender: params.spenderAddress,
      allowance: formatted,
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Gets the allowance that the current user (wallet owner) has granted to a specific spender.
 *
 * This is a convenience function that uses the connected wallet's address as the owner.
 * It retrieves how many tokens the current user has authorized a specific spender to transfer.
 *
 * @param env - The onchain write environment containing the provider and account
 * @param params - Parameters object containing:
 *   - assetAddress: The address of the ERC-20 token contract
 *   - spenderAddress: The address of the spender to check allowance for
 * @returns A promise that resolves to an object with:
 *   - status: "success" or "failure"
 *   - owner: The current user's address (on success)
 *   - spender: The spender address (on success)
 *   - allowance: The formatted allowance amount as a string (on success)
 *   - error: Error message (on failure)
 * @throws {Error} If the wallet address is not configured
 */
export const getMyGivenAllowance = async (
  env: onchainWrite,
  params: z.infer<typeof getMyGivenAllowanceSchema>
) => {
  try {
    const provider = env.provider;
    const owner = env.account.address;
    if (!owner) throw new Error('Wallet address not configured');

    const token = await validateToken(provider, params.asset.assetAddress, params.asset.assetSymbol);

    const raw = await readAllowanceRaw(
      provider,
      token.address,
      owner,
      params.spenderAddress
    );
    const formatted = formatBalance(raw, token.decimals);

    return {
      status: 'success',
      owner,
      spender: params.spenderAddress,
      allowance: formatted,
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Gets the allowance that a specific owner has granted to the current user (wallet owner).
 *
 * This is a convenience function that uses the connected wallet's address as the spender.
 * It retrieves how many tokens a specific owner has authorized the current user to transfer.
 *
 * @param env - The onchain write environment containing the provider and account
 * @param params - Parameters object containing:
 *   - assetAddress: The address of the ERC-20 token contract
 *   - ownerAddress: The address of the token owner
 * @returns A promise that resolves to an object with:
 *   - status: "success" or "failure"
 *   - owner: The owner address (on success)
 *   - spender: The current user's address (on success)
 *   - allowance: The formatted allowance amount as a string (on success)
 *   - error: Error message (on failure)
 * @throws {Error} If the wallet address is not configured
 */
export const getAllowanceGivenToMe = async (
  env: onchainWrite,
  params: z.infer<typeof getAllowanceGivenToMeSchema>
) => {
  try {
    const provider = env.provider;
    const spender = env.account.address;
    if (!spender) throw new Error('Wallet address not configured');

    const token = await validateToken(provider, params.asset.assetAddress, params.asset.assetSymbol);

    const raw = await readAllowanceRaw(
      provider,
      token.address,
      params.ownerAddress,
      spender
    );
    const formatted = formatBalance(raw, token.decimals);

    return {
      status: 'success',
      owner: params.ownerAddress,
      spender,
      allowance: formatted,
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
