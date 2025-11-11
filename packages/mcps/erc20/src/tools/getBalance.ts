import { RpcProvider, validateAndParseAddress } from 'starknet';
import { onchainRead, onchainWrite } from '@kasarlabs/ask-starknet-core';
import {
  formatBalance,
  validateToken,
  uint256HexToBigInt,
} from '../lib/utils/utils.js';
import { validToken } from '../lib/types/types.js';
import { z } from 'zod';
import { getBalanceSchema, getOwnBalanceSchema } from '../schemas/index.js';

/**
 * Reads the balance value from a token contract by trying common entrypoint names.
 *
 * This function attempts multiple entrypoint variants to ensure compatibility with
 * different ERC-20 token implementations on Starknet. It handles both standard
 * Uint256 responses (as [low, high] pairs) and single felt responses.
 *
 * @param provider - The Starknet RPC provider instance
 * @param tokenAddress - The address of the ERC-20 token contract
 * @param accountAddress - The address of the account to query the balance for
 * @returns The raw balance value as a bigint
 * @throws {Error} If all entrypoint attempts fail
 */
async function getBalanceRaw(
  provider: RpcProvider,
  tokenAddress: string,
  accountAddress: string
): Promise<bigint> {
  // Normalize addresses (checksummed/0x-prefixed) to avoid calldata surprises
  const contractAddress = validateAndParseAddress(tokenAddress);
  const account = validateAndParseAddress(accountAddress);

  // Try common entrypoint names used by different ERC-20 implementations
  const entrypoints: Array<'balanceOf' | 'balance_of' | 'get_balance'> = [
    'balanceOf',
    'balance_of',
    'get_balance',
  ];

  let lastErr: unknown = null;

  for (const entrypoint of entrypoints) {
    try {
      const res = await provider.callContract(
        { contractAddress, entrypoint, calldata: [account] },
        'latest'
      );

      const out: string[] = Array.isArray((res as any)?.result)
        ? (res as any).result
        : Array.isArray(res)
          ? (res as any)
          : [];

      // Standard ERC-20 balance: Uint256 is returned as [low, high] pair
      if (out.length >= 2) {
        return uint256HexToBigInt(out[0], out[1]);
      }

      if (out.length === 1) {
        return BigInt(out[0]);
      }
    } catch (e) {
      lastErr = e;
    }
  }

  throw new Error(
    `Failed to read balance on ${contractAddress} for ${account}` +
      (lastErr instanceof Error ? ` (last error: ${lastErr.message})` : '')
  );
}

/**
 * Gets the token balance of the current user (wallet owner).
 *
 * This is a convenience function that uses the connected wallet's address to query
 * the token balance. The result is returned in a human-readable format based on
 * the token's decimals.
 *
 * @param env - The onchain write environment containing the provider and account
 * @param params - Parameters object containing:
 *   - assetAddress: The address of the ERC-20 token contract
 * @returns A promise that resolves to an object with:
 *   - status: "success" or "failure"
 *   - balance: The formatted balance amount as a string (on success)
 *   - error: Error message (on failure)
 * @throws {Error} If the wallet address is not configured
 */
export const getOwnBalance = async (
  env: onchainWrite,
  params: z.infer<typeof getOwnBalanceSchema>
) => {
  try {
    const provider = env.provider;
    const account = env.account;
    const accountAddress = account.address;
    if (!accountAddress) throw new Error('Wallet address not configured');

    const token: validToken = await validateToken(
      provider,
      params.assetAddress
    );

    const rawBalance = await getBalanceRaw(
      provider,
      token.address,
      accountAddress
    );
    const formattedBalance = formatBalance(rawBalance, token.decimals);

    return {
      status: 'success',
      balance: formattedBalance,
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Gets the token balance for a specific account address.
 *
 * This function queries the ERC-20 token contract to retrieve the balance of tokens
 * held by the specified account. The result is returned in a human-readable format
 * based on the token's decimals.
 *
 * @param env - The onchain write environment containing the provider
 * @param params - Parameters object containing:
 *   - assetAddress: The address of the ERC-20 token contract
 *   - accountAddress: The address of the account to query the balance for
 * @returns A promise that resolves to an object with:
 *   - status: "success" or "failure"
 *   - balance: The formatted balance amount as a string (on success)
 *   - error: Error message (on failure)
 * @throws {Error} If the account address is not provided
 */
export const getBalance = async (
  env: onchainWrite,
  params: z.infer<typeof getBalanceSchema>
) => {
  try {
    if (!params?.accountAddress) {
      throw new Error('Account address is required');
    }
    const provider = env.provider;

    const token: validToken = await validateToken(
      provider,
      params.assetAddress
    );

    const rawBalance = await getBalanceRaw(
      provider,
      token.address,
      params.accountAddress
    );
    const formattedBalance = formatBalance(rawBalance, token.decimals);

    return {
      status: 'success',
      balance: formattedBalance,
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
