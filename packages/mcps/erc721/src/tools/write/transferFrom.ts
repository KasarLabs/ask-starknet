import { Account, Contract, constants } from 'starknet';

import { INTERACT_ERC721_ABI } from '../../lib/abis/interact.js';
import {
  validateAndFormatTokenId,
  executeV3Transaction,
} from '../../lib/utils/utils.js';
import { validateAndParseAddress } from 'starknet';
import { z } from 'zod';
import { transferFromSchema, transferSchema } from '../../schemas/index.js';
import { TransactionResult } from '../../lib/types/types.js';
import { onchainWrite, toolResult } from '@kasarlabs/ask-starknet-core';

/**
 * Transfers a token from one address to another.
 * @param {onchainWrite | onchainRead} env - The onchain environment
 * @param {z.infer<typeof transferFromSchema>} params - Transfer parameters
 * @returns {Promise<string>} JSON string with transaction result
 */
export const transferFrom = async (
  env: onchainWrite,
  params: z.infer<typeof transferFromSchema>
): Promise<toolResult> => {
  try {
    if (
      !params?.fromAddress ||
      !params?.toAddress ||
      !params?.tokenId ||
      !params?.contractAddress
    ) {
      throw new Error(
        'From address, to address, token ID and contract address are required'
      );
    }

    const provider = env.provider;
    const account = env.account;

    const fromAddress = validateAndParseAddress(params.fromAddress);
    const toAddress = validateAndParseAddress(params.toAddress);
    const tokenId = validateAndFormatTokenId(params.tokenId);
    const contractAddress = validateAndParseAddress(params.contractAddress);

    const contract = new Contract(
      INTERACT_ERC721_ABI,
      contractAddress,
      provider
    );
    contract.connect(account);

    const calldata = contract.populate('transfer_from', [
      fromAddress,
      toAddress,
      tokenId,
    ]);

    const txH = await executeV3Transaction({
      call: calldata,
      account: account,
    });

    return {
      status: 'success',
      data: {
        tokenId: params.tokenId,
        from: fromAddress,
        to: toAddress,
        transactionHash: txH,
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
 * Transfers a NFT to another address.
 * @param {onchainWrite | onchainRead} env - The onchain environment
 * @param {z.infer<typeof transferSchema>} params - Transfer parameters
 * @returns {Promise<string>} JSON string with transaction result
 */
export const transfer = async (
  env: onchainWrite,
  params: z.infer<typeof transferSchema>
): Promise<toolResult> => {
  try {
    if (!params?.toAddress || !params?.tokenId || !params?.contractAddress) {
      throw new Error('To address, token ID and contract address are required');
    }

    const provider = env.provider;
    const accountCredentials = env.account;

    const toAddress = validateAndParseAddress(params.toAddress);
    const tokenId = validateAndFormatTokenId(params.tokenId);
    const contractAddress = validateAndParseAddress(params.contractAddress);

    const account = new Account(
      provider,
      accountCredentials.address,
      accountCredentials.signer,
      undefined,
      constants.TRANSACTION_VERSION.V3
    );

    const contract = new Contract(
      INTERACT_ERC721_ABI,
      contractAddress,
      provider
    );
    contract.connect(account);

    const calldata = contract.populate('transfer_from', [
      accountCredentials.address,
      toAddress,
      tokenId,
    ]);

    const txH = await executeV3Transaction({
      call: calldata,
      account: account,
    });

    return {
      status: 'success',
      data: {
        tokenId: params.tokenId,
        from: accountCredentials.address,
        to: toAddress,
        transactionHash: txH,
      },
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
