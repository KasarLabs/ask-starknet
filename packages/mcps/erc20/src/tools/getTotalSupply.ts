import { Contract } from 'starknet';
import { onchainRead } from '@kasarlabs/ask-starknet-core';
import {
  validateToken,
  formatBalance,
  detectAbiType,
  extractAssetInfo,
} from '../lib/utils/utils.js';
import { validToken } from '../lib/types/types.js';
import { z } from 'zod';
import { getTotalSupplySchema } from '../schemas/index.js';

/**
 * Gets the total supply of a token
 * @param {SnakAgentInterface} agent - The Starknet agent interface
 * @param {GetTotalSupplyParams} params - Total supply parameters
 * @returns {Promise<string>} JSON string with total supply amount
 * @throws {Error} If operation fails
 */
export const getTotalSupply = async (
  env: onchainRead,
  params: z.infer<typeof getTotalSupplySchema>
) => {
  try {
    const provider = env.provider;

    const { assetSymbol, assetAddress } = extractAssetInfo(params.asset);

    const token: validToken = await validateToken(
      provider,
      assetSymbol,
      assetAddress
    );
    const abi = await detectAbiType(token.address, provider);

    const tokenContract = new Contract(abi, token.address, provider);
    const totalSupply = await tokenContract.total_supply();

    const formattedSupply = formatBalance(totalSupply, token.decimals);

    return {
      status: 'success',
      totalSupply: formattedSupply,
      symbol: token.symbol,
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
