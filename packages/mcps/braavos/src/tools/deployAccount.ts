import { RpcProvider } from 'starknet';
import { onchainRead, toolResult } from '@kasarlabs/ask-starknet-core';
import { AccountManager } from '../lib/utils/AccountManager.js';
import { z } from 'zod';
import { accountDetailsSchema } from '../schemas/index.js';
import {
  BRAAVOS_ACCOUNT_CLASSHASH,
  BRAAVOS_INITIAL_CLASSHASH,
  BRAAVOS_PROXY_CLASSHASH,
} from '../lib/constants/contract.js';

/**
 * Deploys a Braavos account using onchain read environment.
 * @async
 * @function DeployBraavosAccount
 * @param {onchainRead} env - The onchain read environment
 * @param {z.infer<typeof accountDetailsSchema>} params - Account details
 * @returns {Promise<string>} JSON string with deployment status and transaction details
 * @throws {Error} If deployment fails
 */
export const DeployBraavosAccount = async (
  env: onchainRead,
  params: z.infer<typeof accountDetailsSchema>
): Promise<toolResult> => {
  return {
    status: 'failure',
    error: 'Tool under maintenance',
  };
  try {
    const provider = env.provider;

    const accountManager = new AccountManager(
      provider,
      BRAAVOS_INITIAL_CLASSHASH,
      BRAAVOS_PROXY_CLASSHASH,
      BRAAVOS_ACCOUNT_CLASSHASH
    );

    const tx = await accountManager.deployAccount(params);

    return {
      status: 'success',
      data: {
        wallet: 'Braavos',
        transaction_hash: tx.transactionHash,
        contract_address: tx.contractAddress,
      },
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Deploys a Braavos account using direct RPC connection.
 * @async
 * @function DeployBraavosAccountSignature
 * @param {z.infer<typeof accountDetailsSchema>} params - Account details
 * @returns {Promise<string>} JSON string with deployment status and transaction details
 * @throws {Error} If deployment fails
 */
export const DeployBraavosAccountSignature = async (
  params: z.infer<typeof accountDetailsSchema>
): Promise<toolResult> => {
  try {
    const provider = new RpcProvider({ nodeUrl: process.env.STARKNET_RPC_URL });

    const accountManager = new AccountManager(
      provider,
      BRAAVOS_INITIAL_CLASSHASH,
      BRAAVOS_PROXY_CLASSHASH,
      BRAAVOS_ACCOUNT_CLASSHASH
    );

    const tx = await accountManager.deployAccount(params);

    return {
      status: 'success',
      data: {
        wallet: 'Braavos',
        transaction_hash: tx.transactionHash,
        contract_address: tx.contractAddress,
      },
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
