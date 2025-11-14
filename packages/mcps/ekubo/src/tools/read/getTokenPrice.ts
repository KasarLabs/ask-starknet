import { calculateActualPrice } from '../../lib/utils/math.js';
import { onchainRead, toolResult } from '@kasarlabs/ask-starknet-core';
import { GetTokenPriceSchema } from '../../schemas/index.js';
import { getContract } from '../../lib/utils/contracts.js';
import { preparePoolKeyFromParams } from '../../lib/utils/pools.js';

export const getTokenPrice = async (
  env: onchainRead,
  params: GetTokenPriceSchema
): Promise<toolResult> => {
  const provider = env.provider;
  try {
    const contract = await getContract(provider, 'core');

    const { poolKey, token0, token1, isTokenALower } =
      await preparePoolKeyFromParams(env.provider, {
        token0: params.token,
        token1: params.quote_currency,
        fee: params.fee,
        tick_spacing: params.tick_spacing,
        extension: params.extension,
      });

    const priceResult = await contract.get_pool_price(poolKey);
    const sqrtPrice = priceResult.sqrt_ratio;

    // Price from Ekubo is always token1/token0
    const price = calculateActualPrice(
      sqrtPrice,
      token0.decimals,
      token1.decimals
    );

    const finalPrice = isTokenALower ? price : 1 / price;

    return {
      status: 'success',
      data: {
        base_token: params.token.assetValue,
        quote_token: params.quote_currency.assetValue,
        price: finalPrice,
        sqrt_price: sqrtPrice.toString(),
      },
    };
  } catch (error: any) {
    console.error('Error getting token price:', error);
    const errorMessage = error.message;
    const suggestion =
      errorMessage.includes('Pool not found') ||
      errorMessage.includes('does not exist')
        ? `${errorMessage}. Try specifying different fee/tick_spacing values. Common pairs: fee=0.05 tick_spacing=0.1, fee=0.3 tick_spacing=0.6, or fee=1 tick_spacing=2.`
        : errorMessage;

    return {
      status: 'failure',
      error: suggestion,
    };
  }
};
