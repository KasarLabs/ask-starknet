import { Contract } from 'starknet';

import { INTERACT_ERC721_ABI } from '../../lib/abis/interact.js';
import { validateAndFormatTokenId } from '../../lib/utils/utils.js';
import { z } from 'zod';
import { getApprovedSchema } from '../../schemas/index.js';
import { validateAndParseAddress } from 'starknet';
import { onchainRead, toolResult } from '@kasarlabs/ask-starknet-core';

/**
 * Get the address that has been approved to transfer the token.
 * @param agent The SnakAgentInterface instance.
 * @param params The parameters for the getApproved function.
 * @returns A stringified JSON object with the status and the approved address.
 */
export const getApproved = async (
  env: onchainRead,
  params: z.infer<typeof getApprovedSchema>
): Promise<toolResult> => {
  try {
    if (!params?.tokenId || !params?.contractAddress) {
      throw new Error('Both token ID and contract address are required');
    }

    const provider = env.provider;

    const contractAddress = validateAndParseAddress(params.contractAddress);
    const tokenId = validateAndFormatTokenId(params.tokenId);

    const contract = new Contract(
      INTERACT_ERC721_ABI,
      contractAddress,
      provider
    );

    const approvedResponse = await contract.getApproved(tokenId);

    return {
      status: 'success',
      data: { approved: approvedResponse.toString() },
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
