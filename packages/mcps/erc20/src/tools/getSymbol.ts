import { Contract } from 'starknet';
import { onchainRead } from '@kasarlabs/ask-starknet-core';
import { detectAbiType } from '../lib/utils/utils.js';
import { validateAndParseAddress } from 'starknet';
import { OLD_ERC20_ABI } from '../lib/abis/old.js';
import { shortString } from 'starknet';
import { z } from 'zod';
import { getSymbolSchema } from '../schemas/index.js';

/**
 * Gets the symbol of a token from its contract address
 * @param {onchainRead} env - The onchain read environment
 * @param {GetSymbolParams} params - Symbol parameters
 * @returns {Promise<Object>} JSON object with symbol
 * @throws {Error} If operation fails
 */
export const getSymbol = async (
  env: onchainRead,
  params: z.infer<typeof getSymbolSchema>
) => {
  try {
    if (!params?.assetAddress) {
      throw new Error('Asset address is required');
    }

    const provider = env.provider;
    const address = validateAndParseAddress(params.assetAddress);

    const abi = await detectAbiType(address, provider);
    const contract = new Contract(abi, address, provider);

    try {
      const rawSymbol = await contract.symbol();
      const symbol =
        abi === OLD_ERC20_ABI
          ? shortString.decodeShortString(rawSymbol)
          : rawSymbol.toUpperCase();

      return {
        status: 'success',
        symbol: symbol,
        address: address,
      };
    } catch (error) {
      throw new Error(
        `Error getting symbol from contract: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
