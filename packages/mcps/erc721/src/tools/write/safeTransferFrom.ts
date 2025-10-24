import { Account, Contract, constants } from 'starknet';

import { INTERACT_ERC721_ABI } from '../../lib/abis/interact.js';
import {
  validateAndFormatTokenId,
  executeV3Transaction,
} from '../../lib/utils/utils.js';
import { z } from 'zod';
import { safeTransferFromSchema } from '../../schemas/index.js';
import { TransactionResult } from '../../lib/types/types.js';
import { validateAndParseAddress } from 'starknet';
import { onchainWrite } from '@ask-starknet/core';

/**
 * Safely transfers a token from one address to another.
 * @param {onchainWrite | onchainRead} env - The onchain environment
 * @param {z.infer<typeof safeTransferFromSchema>} params - Safe transfer parameters
 * @returns {Promise<string>} JSON string with transaction result
 */
export const safeTransferFrom = async (
  env: onchainWrite,
  params: z.infer<typeof safeTransferFromSchema>
) => {
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
    const data = ['0x0'];

    const contract = new Contract(
      INTERACT_ERC721_ABI,
      contractAddress,
      provider
    );
    contract.connect(account);

    const calldata = contract.populate('safe_transfer_from', [
      fromAddress,
      toAddress,
      tokenId,
      data,
    ]);

    const txH = await executeV3Transaction({
      call: calldata,
      account: account,
    });

    const result: TransactionResult = {
      status: 'success',
      tokenId: params.tokenId,
      from: fromAddress,
      to: toAddress,
      transactionHash: txH,
    };

    return JSON.stringify(result);
  } catch (error) {
    const result: TransactionResult = {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
      step: 'safe transfer execution',
    };
    return JSON.stringify(result);
  }
};
