import { RpcProvider } from 'starknet';
import { ARGENT_CLASS_HASH } from '../lib/constant/contract.js';
import { AccountManager } from '../lib/utils/AccountManager.js';
import { onchainRead, toolResult } from '@kasarlabs/ask-starknet-core';

/**
 * Creates a new Argent account.
 * @async
 * @function CreateArgentAccount
 * @param {envRead} env - Environment with RPC provider
 * @returns {Promise<object>} Object with account details
 * @throws {Error} If account creation fails
 */
export const CreateArgentAccount = async (
  env: onchainRead
): Promise<toolResult> => {
  try {
    const accountManager = new AccountManager(env.provider);
    const accountDetails =
      await accountManager.createAccount(ARGENT_CLASS_HASH);

    return {
      status: 'success',
      data: {
        wallet: 'AX',
        publicKey: accountDetails.publicKey,
        privateKey: accountDetails.privateKey,
        contractAddress: accountDetails.contractAddress,
      },
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
