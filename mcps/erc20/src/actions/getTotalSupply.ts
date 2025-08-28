import { Contract } from 'starknet';
import { SnakAgentInterface } from '../dependances/types.js';
import { validateToken, formatBalance, detectAbiType, extractAssetInfo } from '../utils/utils.js';
import { validToken } from '../types/types.js';
import { z } from 'zod';
import { getTotalSupplySchema } from '../schemas/schema.js';

/**
 * Gets the total supply of a token
 * @param {SnakAgentInterface} agent - The Starknet agent interface
 * @param {GetTotalSupplyParams} params - Total supply parameters
 * @returns {Promise<string>} JSON string with total supply amount
 * @throws {Error} If operation fails
 */
export const getTotalSupply = async (
  agent: SnakAgentInterface,
  params: z.infer<typeof getTotalSupplySchema>
): Promise<string> => {
  try {
    const provider = agent.getProvider();
    
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

    return JSON.stringify({
      status: 'success',
      totalSupply: formattedSupply,
      symbol: token.symbol,
    });
  } catch (error) {
    return JSON.stringify({
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
