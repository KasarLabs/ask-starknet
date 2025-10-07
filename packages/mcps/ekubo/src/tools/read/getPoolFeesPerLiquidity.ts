import { envRead } from '../../interfaces/index.js';
import { PoolKey } from '../../schemas/index.js';
import { getContract } from '../../lib/utils/contracts.js';
import { preparePoolKeyFromParams } from '../../lib/utils/pools.js';

export const getPoolFeesPerLiquidity = async (
  env: envRead,
  params: PoolKey
) => {
  const provider = env.provider;
  try {
    const contract = await getContract(provider, 'core');

    const { poolKey } = await preparePoolKeyFromParams(env.provider, {
      token0: params.token0,
      token1: params.token1,
      fee: params.fee,
      tick_spacing: params.tick_spacing,
      extension: params.extension,
    });

    const feesResult = await contract.get_pool_fees_per_liquidity(poolKey);

    return JSON.stringify({
      status: 'success',
      data: {
        fee_growth_global_0: feesResult.value0.toString(),
        fee_growth_global_1: feesResult.value1.toString(),
      },
    });
  } catch (error: any) {
    console.error('Error getting pool fees per liquidity:', error);
    return JSON.stringify({
      status: 'failure',
      error: error.message,
    });
  }
};
