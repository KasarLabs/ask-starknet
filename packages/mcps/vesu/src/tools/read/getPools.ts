import { z } from 'zod';
import { onchainRead } from '@kasarlabs/ask-starknet-core';
import { VESU_API_URL } from '../../lib/constants/index.js';
import { poolParser, IPool } from '../../interfaces/index.js';
import { GetSchemaType } from '../../schemas/index.js';

/**
 * Retrieves pools from the Vesu API
 * @param {onchainRead} env - The onchain environment (not used for API calls but required by interface)
 * @param {GetSchemaType} params - Function parameters
 * @returns {Promise<IPool[]>} Array of pools matching the criteria
 */
export const getPools = async (
  env: onchainRead,
  params: GetSchemaType
): Promise<IPool[]> => {
  try {
    let pools: IPool[];

    // If poolId is provided, fetch a specific pool
    if (params.poolId) {
      const response = await fetch(
        `${VESU_API_URL}/pools/${params.poolId}?onlyEnabledAssets=${params.onlyEnabledAssets}`
      );

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();

      // Parse the response - single pool returns { data: IPool }
      const parsedPool = z
        .object({ data: poolParser })
        .transform(({ data }) => data)
        .parse(data);

      pools = [
        {
          ...parsedPool,
          assets: parsedPool.assets || [],
        },
      ];
    } else {
      // Fetch all pools
      const response = await fetch(
        `${VESU_API_URL}/pools?onlyVerified=${params.onlyVerified}&onlyEnabledAssets=${params.onlyEnabledAssets}`
      );

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();

      // Parse the response - assuming it returns { data: IPool[] }
      const parsedPools = z
        .object({ data: z.array(poolParser) })
        .transform(({ data }) => data)
        .parse(data);

      // Ensure all pools have required assets array (default to empty if missing)
      pools = parsedPools.map((pool) => ({
        ...pool,
        assets: pool.assets || [],
      }));
    }

    // If pool_name is provided, filter by name (case-insensitive)
    if (params.pool_name) {
      pools = pools.filter(
        (pool) => pool.name.toLowerCase() === params.pool_name!.toLowerCase()
      );
    }

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
