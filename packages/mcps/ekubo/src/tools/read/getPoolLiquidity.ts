import { onchainRead, toolResult } from '@kasarlabs/ask-starknet-core';
import { PoolKey } from '../../schemas/index.js';
import { getContract } from '../../lib/utils/contracts.js';
import { preparePoolKeyFromParams } from '../../lib/utils/pools.js';

export const getPoolLiquidity = async (
  env: onchainRead,
  params: PoolKey
): Promise<toolResult> => {
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

    const liquidityResult = await contract.get_pool_liquidity(poolKey);

    return {
      status: 'success',
      data: {
        liquidity: liquidityResult.toString(),
      },
    };
  } catch (error: any) {
    console.error('Error getting pool liquidity:', error);
    return {
      status: 'failure',
      error: error.message,
    };
  }
};
