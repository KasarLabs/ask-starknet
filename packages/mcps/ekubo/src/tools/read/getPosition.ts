import { onchainRead } from '@kasarlabs/ask-starknet-core';
import { GetPositionSchema } from '../../schemas/index.js';
import { getContract } from '../../lib/utils/contracts.js';
import { preparePoolKeyFromParams } from '../../lib/utils/pools.js';
import { buildBounds } from '../../lib/utils/liquidity.js';
import {
  convertTickSpacingExponentToPercent,
  convertFeeU128ToPercent,
} from '../../lib/utils/math.js';
import {
  fetchPositionData,
  fetchPositionOwner,
} from '../../lib/utils/position.js';

export const getPosition = async (
  env: onchainRead,
  params: GetPositionSchema
) => {
  const provider = env.provider;
  try {
    const positionsContract = await getContract(provider, 'positions');

    // Fetch position data from API to get pool info and bounds
    const positionData = await fetchPositionData(params.position_id);

    // Fetch owner from state API
    const ownerAddress = await fetchPositionOwner(params.position_id);

    // Use API data to prepare pool key
    const token0_address = positionData.token0;
    const token1_address = positionData.token1;
    const fee = convertFeeU128ToPercent(positionData.fee);
    const tick_spacing = convertTickSpacingExponentToPercent(
      Number(positionData.tick_spacing)
    );
    const extension = positionData.extension || '0x0';

    const { poolKey, token0, token1 } = await preparePoolKeyFromParams(
      provider,
      {
        token0_address,
        token1_address,
        fee,
        tick_spacing,
        extension,
      }
    );

    // Use ticks directly from API
    const lowerTick = Number(positionData.tick_lower);
    const upperTick = Number(positionData.tick_upper);

    if (isNaN(lowerTick) || isNaN(upperTick)) {
      throw new Error(
        `Invalid tick values: lower=${positionData.tick_lower}, upper=${positionData.tick_upper}`
      );
    }

    if (lowerTick >= upperTick) {
      throw new Error(
        `Lower tick (${lowerTick}) must be less than upper tick (${upperTick})`
      );
    }

    // Build bounds from ticks
    const bounds = buildBounds(lowerTick, upperTick);

    const positionResult = await positionsContract.get_token_info(
      params.position_id,
      poolKey,
      bounds
    );

    return {
      status: 'success',
      data: {
        position_id: params.position_id,
        owner_address: ownerAddress,
        liquidity: positionResult.liquidity.toString(),
        amount0: positionResult.amount0.toString(),
        amount1: positionResult.amount1.toString(),
        fees0: positionResult.fees0.toString(),
        fees1: positionResult.fees1.toString(),
        token0: token0.symbol || token0.address,
        token1: token1.symbol || token1.address,
        lower_tick: lowerTick,
        upper_tick: upperTick,
        pool_fee: fee,
        tick_spacing: tick_spacing,
      },
    };
  } catch (error: unknown) {
    console.error('Error getting position:', error);
    const errorMessage = error instanceof Error
      ? error.message
      : 'Unknown error while getting position';
    return {
      status: 'failure',
      error: errorMessage,
    };
  }
};
