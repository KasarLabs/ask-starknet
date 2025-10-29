import { Contract } from 'starknet';

import { INTERACT_ERC721_ABI } from '../../lib/abis/interact.js';
import { validateAndParseAddress } from 'starknet';
import { z } from 'zod';
import { getBalanceSchema, getOwnBalanceSchema } from '../../schemas/index.js';
import { onchainRead } from '@ijusttookadnatest/ask-starknet-core';

/**
 * Gets ERC721 token balance
 * @param {onchainWrite | onchainRead} env - The onchain environment
 * @param {z.infer<typeof getBalanceSchema>} params - Balance check parameters
 * @returns {Promise<string>} JSON string with balance result
 */
export const getBalance = async (
  env: onchainRead,
  params: z.infer<typeof getBalanceSchema>
) => {
  try {
    if (!params?.accountAddress || !params?.contractAddress) {
      throw new Error('Both account address and contract address are required');
    }

    const provider = env.provider;

    const accountAddress = validateAndParseAddress(params.accountAddress);
    const contractAddress = validateAndParseAddress(params.contractAddress);

    const contract = new Contract(
      INTERACT_ERC721_ABI,
      contractAddress,
      provider
    );

    const balanceResponse = await contract.balanceOf(accountAddress);

    return {
      status: 'success',
      balance: balanceResponse.toString(),
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
