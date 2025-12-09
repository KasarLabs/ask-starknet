import { z } from 'zod';
import { onchainRead, toolResult } from '@kasarlabs/ask-starknet-core';
import { VESU_API_URL } from '../../lib/constants/index.js';
import { GetTokensSchemaType } from '../../schemas/index.js';
import { IBaseToken, addressSchema } from '../../interfaces/index.js';

/**
 * Token parser for API response
 */
const tokenParser = z.object({
  address: addressSchema,
  name: z.string(),
  symbol: z.string(),
  decimals: z.number(),
});

/**
 * Retrieves all supported tokens from Vesu UI
 * Can filter by token address or symbol to check if a specific token is supported
 * @param {onchainRead} env - The onchain environment (not used for API calls but required by interface)
 * @param {GetTokensSchemaType} params - Function parameters
 * @returns {Promise<toolResult>} Array of supported tokens matching the criteria
 */
export const getTokens = async (
  env: onchainRead,
  params: GetTokensSchemaType
): Promise<toolResult> => {
  try {
    const response = await fetch(`${VESU_API_URL}/tokens`);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();

    // Parse the response - assuming it returns { data: IBaseToken[] }
    const parsedTokens = z
      .object({ data: z.array(tokenParser) })
      .transform(({ data }) => data)
      .parse(data);

    let tokens: IBaseToken[] = parsedTokens.map((token) => ({
      name: token.name,
      address: token.address,
      symbol: token.symbol,
      decimals: token.decimals,
    }));

    // Filter by address if provided
    if (params.address) {
      // Normalize address: remove 0x, pad to 64 chars, add 0x back, lowercase
      const normalizeAddress = (addr: string): string => {
        const withoutPrefix = addr.startsWith('0x') ? addr.slice(2) : addr;
        const padded = withoutPrefix.padStart(64, '0');
        return `0x${padded}`.toLowerCase();
      };

      const normalizedInputAddress = normalizeAddress(params.address);
      tokens = tokens.filter((token) => {
        const normalizedTokenAddress = normalizeAddress(token.address);
        return normalizedTokenAddress === normalizedInputAddress;
      });
    }

    // Filter by symbol if provided
    if (params.symbol) {
      const normalizedSymbol = params.symbol.toLowerCase();
      tokens = tokens.filter(
        (token) => token.symbol.toLowerCase() === normalizedSymbol
      );
    }

    return {
      status: 'success',
      data: tokens,
    };
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return {
      status: 'failure',
      error:
        error instanceof Error
          ? `Failed to fetch tokens: ${error.message}`
          : 'Failed to fetch tokens: Unknown error',
    };
  }
};
