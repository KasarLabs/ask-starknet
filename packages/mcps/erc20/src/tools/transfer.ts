import { Account, constants, Contract } from 'starknet';
import { onchainWrite } from '@kasarlabs/ask-starknet-core';
import {
  validateAndFormatParams,
  executeV3Transaction,
  validateToken,
  detectAbiType,
} from '../lib/utils/utils.js';
import { z } from 'zod';
import { transferSchema, transferSignatureSchema } from '../schemas/index.js';
import { TransferResult } from '../lib/types/types.js';
import { validToken } from '../lib/types/types.js';
import { RpcProvider } from 'starknet';

/**
 * Transfers ERC20 tokens on Starknet
 * @param {onchainWrite} env - The onchain write environment
 * @param {TransferParams} params - Transfer parameters
 * @returns {Promise<string>} JSON string with transaction result
 * @throws {Error} If transfer fails
 */
export const transfer = async (
  env: onchainWrite,
  params: z.infer<typeof transferSchema>
) => {
  try {
    const provider = env.provider;
    const account = env.account;

    const token: validToken = await validateToken(
      provider,
      params.asset.assetAddress,
      params.asset.assetSymbol
    );
    const abi = await detectAbiType(token.address, provider);
    const { address, amount } = validateAndFormatParams(
      params.recipientAddress,
      params.amount,
      token.decimals
    );

    const recipientAddress = address;

    // Check if account exists, if not throw a clearer error
    try {
      const nonce = await account.getNonce();
      console.error(`Account nonce: ${nonce}`);
    } catch (error) {
      throw new Error(
        `Account not found on this network. Please verify your account address and network. Account: ${account.address}. Error: ${error.message}`
      );
    }

    const contract = new Contract({
      abi,
      address: token.address,
      providerOrAccount: account,
    });
    const calldata = contract.populate('transfer', {
      recipient: recipientAddress,
      amount: amount,
    });

    const txH = await executeV3Transaction({
      call: calldata,
      account: account,
    });

    return {
      status: 'success',
      amount: params.amount,
      recipients_address: recipientAddress,
      transaction_hash: txH,
    };
  } catch (error) {
    const transferResult: TransferResult = {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
      step: 'transfer execution',
    };
    return transferResult;
  }
};
