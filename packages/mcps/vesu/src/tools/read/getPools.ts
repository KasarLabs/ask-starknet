import { z } from 'zod';
import { onchainRead } from '@kasarlabs/ask-starknet-core';
import { VESU_API_URL } from '../../lib/constants/index.js';
import { poolParser, IPool } from '../../interfaces/index.js';
import { GetSchemaType } from '../../schemas/index.js';

/**
 * Retrieves all pools from the Vesu API
 * @param {onchainRead} env - The onchain environment (not used for API calls but required by interface)
 * @param {GetSchemaType} params - Function parameters (empty object)
 * @returns {Promise<IPool[]>} Array of all pools in the protocol
 */
export const getPools = async (
  env: onchainRead,
  params: GetSchemaType
): Promise<IPool[]> => {
  try {
    const response = await fetch(`${VESU_API_URL}/pools`);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();

    // Parse the response - assuming it returns { data: IPool[] } or IPool[]
    const parsedPools = z
      .object({ data: z.array(poolParser) })
      .transform(({ data }) => data)
      .parse(data);

    // Ensure all pools have required assets array (default to empty if missing)
    const pools: IPool[] = parsedPools.map((pool) => ({
      ...pool,
      assets: pool.assets || [],
    }));

    return pools;
  } catch (error) {
    console.error('Error fetching pools:', error);
    throw new Error(
      error instanceof Error
        ? `Failed to fetch pools: ${error.message}`
        : 'Failed to fetch pools: Unknown error'
    );
  }
};
