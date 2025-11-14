import { Contract } from 'starknet';

import { INTERACT_ERC721_ABI } from '../../lib/abis/interact.js';
import { validateAndParseAddress } from 'starknet';
import { z } from 'zod';
import { isApprovedForAllSchema } from '../../schemas/index.js';
import { onchainRead, toolResult } from '@kasarlabs/ask-starknet-core';

/**
 * Checks if an operator is approved to manage all tokens of an owner.
 * @param {onchainWrite | onchainRead} env - The onchain environment
 * @param {z.infer<typeof isApprovedForAllSchema>} params - Approval check parameters
 * @returns {Promise<string>} JSON string with approval status
 */
export const isApprovedForAll = async (
  env: onchainRead,
  params: z.infer<typeof isApprovedForAllSchema>
): Promise<toolResult> => {
  try {
    if (
      !params?.ownerAddress ||
      !params?.operatorAddress ||
      !params?.contractAddress
    ) {
      throw new Error(
        'Owner address, operator address and contract address are required'
      );
    }

    const provider = env.provider;

    const ownerAddress = validateAndParseAddress(params.ownerAddress);
    const operatorAddress = validateAndParseAddress(params.operatorAddress);
    const contractAddress = validateAndParseAddress(params.contractAddress);

    const contract = new Contract(
      INTERACT_ERC721_ABI,
      contractAddress,
      provider
    );

    const approvedResponse = await contract.isApprovedForAll(
      ownerAddress,
      operatorAddress
    );

    return {
      status: 'success',
      data: { isApproved: approvedResponse === true },
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
