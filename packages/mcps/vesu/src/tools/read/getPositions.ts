import { z } from 'zod';
import { onchainRead, toolResult } from '@kasarlabs/ask-starknet-core';
import { VESU_API_URL } from '../../lib/constants/index.js';
import { GetPositionsSchemaType } from '../../schemas/index.js';
import { positionParser, IPosition } from '../../interfaces/index.js';

/**
 * Retrieves positions from the Vesu API for a given wallet address
 * @param {onchainRead} env - The onchain environment (not used for API calls but required by interface)
 * @param {GetPositionsSchemaType} params - Function parameters
 * @returns {Promise<toolResult>} Array of positions matching the criteria
 */
export const getPositions = async (
  env: onchainRead,
  params: GetPositionsSchemaType
): Promise<toolResult> => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('walletAddress', params.walletAddress);

    if (params.type && params.type.length > 0) {
      params.type.forEach((t) => {
        queryParams.append('type', t);
      });
    }

    if (params.maxHealthFactor) {
      queryParams.append('maxHealthFactor', params.maxHealthFactor);
    }

    if (params.hasRebalancingEnabled !== undefined) {
      queryParams.append(
        'hasRebalancingEnabled',
        params.hasRebalancingEnabled.toString()
      );
    }

    const response = await fetch(
      `${VESU_API_URL}/positions?${queryParams.toString()}`
    );

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();

    // Parse the response - assuming it returns { data: IPosition[] }
    const parsedPositions = z
      .object({ data: z.array(positionParser) })
      .transform(({ data }) => data)
      .parse(data);

    return {
      status: 'success',
      data: parsedPositions,
    };
  } catch (error) {
    console.error('Error fetching positions:', error);
    return {
      status: 'failure',
      error:
        error instanceof Error
          ? `Failed to fetch positions: ${error.message}`
          : 'Failed to fetch positions: Unknown error',
    };
  }
};
