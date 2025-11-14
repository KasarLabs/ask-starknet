import { RpcProvider } from 'starknet';
import { OKX_CLASSHASH } from '../lib/constant/contract.js';
import { AccountManager } from '../lib/utils/AccountManager.js';
import { toolResult } from '@kasarlabs/ask-starknet-core';

/**
 * Creates a new OKX account.
 * @async
 * @function CreateOKXAccount
 * @returns {Promise<string>} JSON string with account details
 * @throws {Error} If account creation fails
 */
export const CreateOKXAccount = async (): Promise<toolResult> => {
  try {
    const accountManager = new AccountManager(undefined);
    const accountDetails = await accountManager.createAccount(OKX_CLASSHASH);

    return {
      status: 'success',
      data: {
        wallet: 'OKX',
        publicKey: accountDetails.publicKey,
        privateKey: accountDetails.privateKey,
        contractAddress: accountDetails.contractAddress,
      }
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
