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
 * @param {IPool['id']} poolId - Pool identifier
 * @param {IPool['extensionContractAddress']} poolExtensionContractAddress - Extension contract address
 * @param {IPoolAsset[]} poolAssets - Array of pool assets
 * @returns {Promise<IPoolAsset[]>} Updated pool assets with prices and risk metrics
 */
export async function getPoolAssetsPriceAndRiskMdx(
  poolId: IPool['id'],
  poolExtensionContractAddress: IPool['extensionContractAddress'],
  poolAssets: IPoolAsset[]
): Promise<IPoolAsset[]> {
  return await Promise.all(
    poolAssets.map(async (asset) => {
      const usdPrice = poolExtensionContractAddress
        ? await getTokenPrice(asset, poolId, poolExtensionContractAddress)
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
  const pool = z
    .object({ data: poolParser })
    .transform(({ data }) => data)
    .parse(data);
  const assets = await getPoolAssetsPriceAndRiskMdx(
    pool.id,
    pool.extensionContractAddress,
    pool.assets
  );

  return { ...pool, assets };
}
