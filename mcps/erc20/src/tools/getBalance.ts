import { Contract } from 'starknet';
import { SnakAgentInterface } from '../dependances/types.js';
import { detectAbiType } from '../utils/utils.js';
import {
  formatBalance,
  validateToken,
  extractAssetInfo,
} from '../utils/utils.js';
import { validToken } from '../types/types.js';
import { z } from 'zod';
import { getBalanceSchema, getOwnBalanceSchema } from '../schemas/schema.js';

/**
 * Gets own token balance
 * @param {SnakAgentInterface} agent - The Starknet agent interface
 * @param {OwnBalanceParams} params - Balance parameters
 * @returns {Promise<string>} JSON string with balance amount
 * @throws {Error} If operation fails
 */
export const getOwnBalance = async (
  agent: SnakAgentInterface,
  params: z.infer<typeof getOwnBalanceSchema>
): Promise<string> => {
  try {
    const provider = agent.getProvider();
    const accountCredentials = agent.getAccountCredentials();
    const accountAddress = accountCredentials?.accountPublicKey;

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

    return JSON.stringify({
      status: 'success',
      balance: formattedBalance,
      symbol: token.symbol,
    });
  } catch (error) {
    return JSON.stringify({
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Gets token balance for an address
 * @param {SnakAgentInterface} agent - The Starknet agent interface
 * @param {BalanceParams} params - Balance parameters
 * @returns {Promise<string>} JSON string with balance amount
 * @throws {Error} If operation fails
 */
export const getBalance = async (
  agent: SnakAgentInterface,
  params: z.infer<typeof getBalanceSchema>
): Promise<string> => {
  try {
    if (!params?.accountAddress) {
      throw new Error('Account address are required');
    }
    const provider = agent.getProvider();

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

    return JSON.stringify({
      status: 'success',
      balance: formattedBalance,
      symbol: token.symbol,
    });
  } catch (error) {
    return JSON.stringify({
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
