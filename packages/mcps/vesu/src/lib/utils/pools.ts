import { z } from 'zod';
import {
  IBaseToken,
  IPool,
  IPoolAsset,
  ITokenValue,
  poolParser,
} from '../../interfaces/index.js';
import { DEFAULT_DECIMALS, VESU_API_URL } from '../../lib/constants/index.js';
import { Hex, toBN } from './num.js';
import { getExtensionContract } from './contracts.js';
import type { Address } from '../../interfaces/index.js';

/**
 * Gets the extension contract address based on protocol version
 * - v1: extensionContractAddress is present, use it
 * - v2: extensionContractAddress is null, use pool.id as the address
 * @param {IPool} pool - Pool information
 * @returns {Address | null} Extension contract address or null if not available
 */
export function getExtensionContractAddress(pool: IPool): Address | null {
  if (pool.protocolVersion === 'v1') {
    // v1: extensionContractAddress exists
    return pool.extensionContractAddress;
  } else {
    // v2: extensionContractAddress is null, use pool.id
    return pool.id as Address;
  }
}

/**
 * Gets the singleton contract address based on protocol version
 * - v1: extensionContractAddress exists, call singleton() method on extension contract
 * - v2: extensionContractAddress is pool.id, try to call singleton() method, fallback to extension address if it fails
 * @param {IPool} pool - Pool information
 * @returns {Promise<Address | null>} Singleton contract address or null if not available
 */
export async function getSingletonAddress(pool: IPool): Promise<Address | null> {
  const extensionContractAddress = getExtensionContractAddress(pool);
  if (!extensionContractAddress) {
    return null;
  }

  // For both v1 and v2, try to call singleton() method on extension contract
  // In v2, extensionContractAddress is pool.id (which is the extension contract address)
  try {
    const extensionContract = getExtensionContract(extensionContractAddress);
    const singletonAddress = (await extensionContract.singleton()) as Address;
    return singletonAddress;
  } catch (error) {
    // If singleton() call fails, check protocol version
    if (pool.protocolVersion === 'v2') {
      // For v2, if singleton() fails, the extension contract (pool.id) might be the singleton itself
      // But this usually means pool.id is not a valid contract address
      // Return extension address as fallback, but log a warning
      console.warn(`Failed to call singleton() on extension contract for v2 pool. Using extension address as fallback: ${extensionContractAddress}`);
      return extensionContractAddress;
    } else {
      // For v1, singleton() should work, so throw the error
      throw new Error(`Failed to get singleton address from extension contract: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Retrieves token price from the pool extension contract
 * @param {IBaseToken} token - The token to get price for
 * @param {string} poolId - The pool identifier
 * @param {Hex} poolExtension - The pool extension contract address
 * @returns {Promise<ITokenValue | undefined>} Token price information if available
 */
export async function getTokenPrice(
  token: IBaseToken,
  poolId: string,
  poolExtension: Hex
): Promise<ITokenValue | undefined> {
  const contract = getExtensionContract(poolExtension);

  try {
    const res = await contract.price(poolId, token.address);
    return res.is_valid && res.value
      ? { value: toBN(res.value), decimals: DEFAULT_DECIMALS }
      : undefined;
  } catch (err) {
    // logger.error('error', err);
    return undefined;
  }
}

/**
 * Retrieves and updates pool assets with prices and risk metrics
 * @param {IPool} pool - Pool information
 * @param {IPoolAsset[]} poolAssets - Array of pool assets
 * @returns {Promise<IPoolAsset[]>} Updated pool assets with prices and risk metrics
 */
export async function getPoolAssetsPriceAndRiskMdx(
  pool: IPool,
  poolAssets: IPoolAsset[]
): Promise<IPoolAsset[]> {
  const extensionContractAddress = getExtensionContractAddress(pool);
  
  return await Promise.all(
    poolAssets.map(async (asset) => {
      const usdPrice = extensionContractAddress
        ? await getTokenPrice(asset, pool.id, extensionContractAddress)
        : undefined;

      return {
        ...asset,
        risk: null,
        usdPrice,
      };
    })
  );
}
/**
 * Retrieves pool information and updates assets with prices
 * @param {string} poolId - Pool identifier
 * @returns {Promise<IPool>} Updated pool information
 */
export async function getPool(poolId: string): Promise<IPool> {
  const data = await fetch(`${VESU_API_URL}/pools/${poolId}`).then((res) =>
    res.json()
  );
  const parsedData = z
    .object({ data: poolParser })
    .transform(({ data }) => data)
    .parse(data);
  
  // Ensure assets is always defined
  const pool: IPool = {
    ...parsedData,
    assets: parsedData.assets || [],
  };
  
  const assets = await getPoolAssetsPriceAndRiskMdx(
    pool,
    pool.assets
  );

  return { ...pool, assets };
}
