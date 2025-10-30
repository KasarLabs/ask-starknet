import { OKX_CLASSHASH } from '../lib/constant/contract.js';
import { AccountManager } from '../lib/utils/AccountManager.js';
import { z } from 'zod';
import { accountDetailsSchema } from '../schemas/schema.js';
import { onchainRead, onchainWrite } from '@kasarlabs/ask-starknet-core';

/**
 * Deploys an OKX account using Starknet agent.
 * @async
 * @function DeployOKXAccount
 * @param {onchainWrite | onchainRead} env - The onchain environment
 * @param {z.infer<typeof accountDetailsSchema>} params - Account details
 * @returns {Promise<string>} JSON string with deployment result
 * @throws {Error} If deployment fails
 */
export const DeployOKXAccount = async (
  env: onchainRead,
  params: z.infer<typeof accountDetailsSchema>
) => {
  try {
    const provider = env.provider;

    const accountManager = new AccountManager(provider);
    const tx = await accountManager.deployAccount(OKX_CLASSHASH, params);

    return {
      status: 'success',
      wallet: 'OKX',
      transaction_hash: tx.transactionHash,
      contract_address: tx.contractAddress,
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
