import { Contract } from 'starknet';
import { onchainWrite } from '@ijusttookadnatest/core';
import { detectAbiType } from '../lib/utils/utils.js';
import {
  formatBalance,
  validateToken,
  extractAssetInfo,
} from '../lib/utils/utils.js';
import { validToken } from '../lib/types/types.js';
import { z } from 'zod';
import { getBalanceSchema, getOwnBalanceSchema } from '../schemas/index.js';

/**
 * Gets own token balance
 * @param {onchainWrite} env - The onchain write environment
 * @param {OwnBalanceParams} params - Balance parameters
 * @returns {Promise<string>} JSON string with balance amount
 * @throws {Error} If operation fails
 */
export const getOwnBalance = async (
  env: onchainWrite,
  params: z.infer<typeof getOwnBalanceSchema>
) => {
  try {
    const provider = env.provider;
    const account = env.account;
    const accountAddress = account.address;

    const { assetSymbol, assetAddress } = extractAssetInfo(params.asset);

    const token: validToken = await validateToken(
      provider,
      assetSymbol,
      assetAddress
    );
    const abi = await detectAbiType(token.address, provider);
    if (!accountAddress) {
      throw new Error('Wallet address not configured');
    }

    const tokenContract = new Contract(abi, token.address, provider);

    const balanceResponse = await tokenContract.balance_of(accountAddress);

    if (balanceResponse === undefined || balanceResponse === null) {
      throw new Error('No balance value received from contract');
    }

    const formattedBalance = formatBalance(balanceResponse, token.decimals);

    return {
      status: 'success',
      balance: formattedBalance,
      symbol: token.symbol,
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Gets token balance for an address
 * @param {onchainWrite} env - The onchain write environment
 * @param {BalanceParams} params - Balance parameters
 * @returns {Promise<string>} JSON string with balance amount
 * @throws {Error} If operation fails
 */
export const getBalance = async (
  env: onchainWrite,
  params: z.infer<typeof getBalanceSchema>
) => {
  try {
    if (!params?.accountAddress) {
      throw new Error('Account address are required');
    }
    const provider = env.provider;

    const { assetSymbol, assetAddress } = extractAssetInfo(params.asset);

    const token = await validateToken(provider, assetSymbol, assetAddress);
    const abi = await detectAbiType(token.address, provider);
    const tokenContract = new Contract(abi, token.address, provider);

    const balanceResponse = await tokenContract.balanceOf(
      params.accountAddress
    );

    const balanceValue =
      typeof balanceResponse === 'object' && 'balance' in balanceResponse
        ? balanceResponse.balance
        : balanceResponse;

    const formattedBalance = formatBalance(balanceValue, token.decimals);

    return {
      status: 'success',
      balance: formattedBalance,
      symbol: token.symbol,
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
