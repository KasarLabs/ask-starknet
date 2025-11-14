import { onchainRead } from '@kasarlabs/ask-starknet-core';
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

    const {
      poolKey,
      token0: t0,
      token1: t1,
      isTokenALower,
    } = await preparePoolKeyFromParams(env.provider, {
      token0_symbol: params.token0_symbol,
      token0_address: params.token0_address,
      token1_symbol: params.token1_symbol,
      token1_address: params.token1_address,
      fee: params.fee,
      tick_spacing: params.tick_spacing,
      extension: params.extension,
    });

    // Normalize: ensure token0 is always the lower address token
    const [token0, token1] = isTokenALower ? [t0, t1] : [t1, t0];

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
