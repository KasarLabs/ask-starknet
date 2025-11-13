import { RpcProvider } from 'starknet';
import { ARGENT_CLASS_HASH } from '../lib/constant/contract.js';
import { AccountManager } from '../lib/utils/AccountManager.js';
import { onchainRead } from '@kasarlabs/ask-starknet-core';

/**
 * Creates a new Argent account.
 * @async
 * @function CreateArgentAccount
 * @param {envRead} env - Environment with RPC provider
 * @returns {Promise<object>} Object with account details
 * @throws {Error} If account creation fails
 */
export const CreateArgentAccount = async (env: onchainRead) => {
  try {
    const accountManager = new AccountManager(env.provider);
    const accountDetails =
      await accountManager.createAccount(ARGENT_CLASS_HASH);

    return {
      status: 'success',
      data : {
        wallet: 'AX',
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

/**
 * Creates an Argent account with deployment fee estimation.
 * @async
 * @function CreateArgentAccountSignature
 * @returns {Promise<object>} Object with account and fee details
 * @throws {Error} If creation or fee estimation fails
 */
export const CreateArgentAccountSignature = async () => {
  try {
    const provider = new RpcProvider({ nodeUrl: process.env.STARKNET_RPC_URL });

    const accountManager = new AccountManager(provider);
    const accountDetails =
      await accountManager.createAccount(ARGENT_CLASS_HASH);
    const suggestedMaxFee = await accountManager.estimateAccountDeployFee(
      ARGENT_CLASS_HASH,
      accountDetails
    );
    const maxFee = suggestedMaxFee.suggestedMaxFee * 2n;

    return {
      status: 'success',
      transaction_type: 'CREATE_ACCOUNT',
      wallet: 'AX',
      publicKey: accountDetails.publicKey,
      privateKey: accountDetails.privateKey,
      contractAddress: accountDetails.contractAddress,
      deployFee: maxFee.toString(),
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
