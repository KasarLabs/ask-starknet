import {
  Account,
  Contract,
  constants,
  validateAndParseAddress,
} from 'starknet';
import { onchainWrite } from '@kasarlabs/ask-starknet-core';
import { INTERACT_ERC721_ABI } from '../../lib/abis/interact.js';
import {
  validateAndFormatTokenId,
  executeV3Transaction,
} from '../../lib/utils/utils.js';
import { z } from 'zod';
import { approveSchema } from '../../schemas/index.js';
import { TransactionResult } from '../../lib/types/types.js';

/**
 * Approves an address for NFT transfer
 * @param {onchainWrite | onchainRead} env - The onchain environment
 * @param {z.infer<typeof approveSchema>} params - Approval parameters
 * @returns {Promise<string>} JSON string with transaction result
 */
export const approve = async (
  env: onchainWrite,
  params: z.infer<typeof approveSchema>
) => {
  try {
    if (
      !params?.approvedAddress ||
      !params?.tokenId ||
      !params?.contractAddress
    ) {
      throw new Error(
        'Approved address, token ID and contract address are required'
      );
    }
    const provider = env.provider;
    const account = env.account;

    const approvedAddress = validateAndParseAddress(params.approvedAddress);
    const contractAddress = validateAndParseAddress(params.contractAddress);
    const tokenId = validateAndFormatTokenId(params.tokenId);

    const contract = new Contract({
      abi: INTERACT_ERC721_ABI,
      address: contractAddress,
      providerOrAccount: provider,
    });
    contract.connect(account);

    const calldata = contract.populate('approve', [approvedAddress, tokenId]);

    const txH = await executeV3Transaction({
      call: calldata,
      account: account,
    });

    const result: TransactionResult = {
      status: 'success',
      tokenId: params.tokenId,
      approved: true,
      transactionHash: txH,
    };

    return result;
  } catch (error) {
    const result: TransactionResult = {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
      step: 'approve execution',
    };
    return result;
  }
};
