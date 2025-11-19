import { ContractAddressParams } from '../schemas/index.js';
import { Contract } from 'starknet';

import { FACTORY_ABI } from '../lib/abis/unruggableFactory.js';
import { FACTORY_ADDRESS } from '../lib/constants/index.js';
import { onchainWrite } from '@kasarlabs/ask-starknet-core';

/**
 * Checks if a given contract address is a memecoin created by the Unruggable Factory.
 *
 * This function verifies whether a contract at the specified address was deployed
 * through the Unruggable Factory and implements the required memecoin interface.
 *
 * @param {onchainWrite | onchainRead} env - The onchain environment
 * @param {ContractAddressParams} params - Object containing the contract address to check
 * @returns {Promise<string>} JSON string containing either success response with boolean result
 *                           or error response with error message
 *
 * @example
 * ```typescript
 * // Check if a contract is a memecoin
 * const result = await isMemecoin({
 *   contractAddress: "0x123abc..."
 * });
 *
 * const response = JSON.parse(result);
 * if (response.status === 'success') {
 *   if (response.isMemecoin) {
 *     console.log('Contract is a valid memecoin');
 *   } else {
 *     console.log('Contract is not a memecoin');
 *   }
 * } else {
 *   console.error('Check failed:', response.error);
 * }
 * ```
 *
 * @throws Will return error response if:
 * - Invalid contract address format
 * - Contract doesn't exist at the provided address
 * - RPC connection fails
 * - Contract call reverts
 *
 * @note
 * - This is a view function that doesn't modify state
 * - Returns false for non-existent contracts
 * - Returns false for contracts that weren't created by the factory
 * - Can be used to verify token authenticity before trading
 */
export const isMemecoin = async (
  env: onchainWrite,
  params: ContractAddressParams
) => {
  try {
    const provider = env.provider;
    const contract = new Contract({
      abi: FACTORY_ABI,
      address: FACTORY_ADDRESS,
      providerOrAccount: provider,
    });
    const result = await contract.is_memecoin(params.contractAddress);

    return {
      status: 'success',
      isMemecoin: result,
    };
  } catch (error) {
    console.error('Error checking memecoin status:', error);
    return {
      status: 'failed',
      error: error.message,
    };
  }
};
