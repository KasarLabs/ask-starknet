import { onchainRead } from '@ask-starknet/core';
import { PoolKey } from '../../schemas/index.js';
import {
  calculateTickFromSqrtPrice,
  calculateActualPrice,
} from '../../lib/utils/math.js';
import { getContract } from '../../lib/utils/contracts.js';
import { preparePoolKeyFromParams } from '../../lib/utils/pools.js';

export const getPoolInfo = async (env: onchainRead, params: PoolKey) => {
  const provider = env.provider;
  try {
    const contract = await getContract(provider, 'core');

    const { poolKey, token0, token1 } = await preparePoolKeyFromParams(
      env.provider,
      {
        token0: params.token0,
        token1: params.token1,
        fee: params.fee,
        tick_spacing: params.tick_spacing,
        extension: params.extension,
      }
    );

    const priceResult = await contract.get_pool_price(poolKey);
    const liquidityResult = await contract.get_pool_liquidity(poolKey);
    const feesResult = await contract.get_pool_fees_per_liquidity(poolKey);

    const sqrtPrice = priceResult.sqrt_ratio;
    const currentTick = calculateTickFromSqrtPrice(sqrtPrice);

    // Calculate human-readable price (token1/token0)
    const readablePrice = calculateActualPrice(
      sqrtPrice,
      token0.decimals,
      token1.decimals
    );

    return {
      status: 'success',
      data: {
        token0: token0.symbol,
        token1: token1.symbol,
        sqrt_price: sqrtPrice.toString(),
        price: readablePrice,
        liquidity: liquidityResult.toString(),
        fees_per_liquidity: {
          fee_growth_global_0: feesResult.value0.toString(),
          fee_growth_global_1: feesResult.value1.toString(),
        },
        current_tick: currentTick,
      },
    };
  } catch (error) {
    console.error('Error getting pool information:', error);
    return {
      status: 'failed',
      error: error.message,
    };
  }
};
