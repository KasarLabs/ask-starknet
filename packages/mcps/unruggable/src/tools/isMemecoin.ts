import { ContractAddressParams } from '../schemas/index.js';
import { Contract } from 'starknet';
import { FACTORY_ABI } from '../lib/abis/unruggableFactory.js';
import { FACTORY_ADDRESS } from '../lib/constants/index.js';
import { onchainWrite, toolResult } from '@kasarlabs/ask-starknet-core';

/**
 * Checks if a given contract address is a memecoin created by the Unruggable Factory.
 *
 * @param env - The onchain environment
 * @param params - Object containing the contract address to check
 * @returns Promise with boolean result indicating if the contract is a memecoin
 */
export const isMemecoin = async (
  env: onchainWrite,
  params: ContractAddressParams
): Promise<toolResult> => {
  try {
    const { provider } = env;
    const contract = new Contract({
      abi: FACTORY_ABI,
      address: FACTORY_ADDRESS,
      providerOrAccount: provider,
    });

    const result = await contract.is_memecoin(params.contractAddress);

    return {
      status: 'success',
      data: { isMemecoin: result },
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error.message,
    };
  }
};
