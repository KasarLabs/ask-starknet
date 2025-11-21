import { Account, Contract, constants } from 'starknet';

import { INTERACT_ERC721_ABI } from '../../lib/abis/interact.js';
import { executeV3Transaction } from '../../lib/utils/utils.js';
import { z } from 'zod';
import { setApprovalForAllSchema } from '../../schemas/index.js';
import { TransactionResult } from '../../lib/types/types.js';
import { validateAndParseAddress } from 'starknet';
import { onchainWrite } from '@kasarlabs/ask-starknet-core';

/**
 * Set the approval for all tokens of the contract.
 * @param {onchainWrite | onchainRead} env - The onchain environment
 * @param {z.infer<typeof setApprovalForAllSchema>} params - Approval parameters
 * @returns {Promise<string>} JSON string with transaction result
 */
export const setApprovalForAll = async (
  env: onchainWrite,
  params: z.infer<typeof setApprovalForAllSchema>
) => {
  try {
    if (
      !params?.operatorAddress ||
      params?.approved === undefined ||
      !params?.contractAddress
    ) {
      throw new Error(
        'Operator address, approved status and contract address are required'
      );
    }
    const provider = env.provider;
    const account = env.account;

    const operatorAddress = validateAndParseAddress(params.operatorAddress);
    const contractAddress = validateAndParseAddress(params.contractAddress);

    const contract = new Contract({
      abi: INTERACT_ERC721_ABI,
      address: contractAddress,
      providerOrAccount: account,
    });
    const calldata = contract.populate('set_approval_for_all', [
      operatorAddress,
      params.approved ? true : false,
    ]);

    const txH = await executeV3Transaction({
      call: calldata,
      account: account,
    });

    const result: TransactionResult = {
      status: 'success',
      operator: operatorAddress,
      approved: params.approved,
      transactionHash: txH,
    };

    return JSON.stringify(result);
  } catch (error) {
    const result: TransactionResult = {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
      step: 'setApprovalForAll execution',
    };
    return JSON.stringify(result);
  }
};
