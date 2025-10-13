import { RpcProvider } from 'starknet';
import { SnakAgentInterface } from '../lib/dependances/types.js';
import { ARGENT_CLASS_HASH } from '../lib/constant/contract.js';
import { AccountManager } from '../lib/utils/AccountManager.js';
import { z } from 'zod';
import { accountDetailsSchema } from '../schemas/schema.js';

/**
 * Deploys an Argent account using Starknet agent.
 * @async
 * @function DeployArgentAccount
 * @param {SnakAgentInterface} agent - The Starknet agent
 * @param {z.infer<typeof accountDetailsSchema>} params - Account details
 * @returns {Promise<string>} JSON string with deployment result
 * @throws {Error} If deployment fails
 */
export const DeployArgentAccount = async (
  agent: SnakAgentInterface,
  params: z.infer<typeof accountDetailsSchema>
) => {
  try {
    const provider = agent.getProvider();

    const accountManager = new AccountManager(provider);
    const tx = await accountManager.deployAccount(ARGENT_CLASS_HASH, params);

    return {
      status: 'success',
      wallet: 'AX',
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

/**
 * Deploys an Argent account using RPC.
 * @async
 * @function DeployArgentAccountSignature
 * @param {z.infer<typeof accountDetailsSchema>} params - Account details
 * @returns {Promise<string>} JSON string with deployment result
 * @throws {Error} If deployment fails
 */
export const DeployArgentAccountSignature = async (
  params: z.infer<typeof accountDetailsSchema>
) => {
  try {
    const provider = new RpcProvider({ nodeUrl: process.env.STARKNET_RPC_URL });

    const accountManager = new AccountManager(provider);
    const tx = await accountManager.deployAccount(ARGENT_CLASS_HASH, params);

    return {
      status: 'success',
      wallet: 'AX',
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
