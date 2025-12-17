import { onchainRead } from '@kasarlabs/ask-starknet-core';
import { GetPositionsSchema } from '../../schemas/index.js';
import { getContract } from '../../lib/utils/contracts.js';
import { preparePoolKeyFromParams } from '../../lib/utils/pools.js';
import { buildBounds } from '../../lib/utils/liquidity.js';
import {
  convertTickSpacingExponentToPercent,
  convertFeeU128ToPercent,
} from '../../lib/utils/math.js';
import {
  fetchPositionData,
  type PositionData,
} from '../../lib/utils/position.js';

/**
 * Convert hex string position ID to number for comparison
 */
function hexToNumber(hexId: string): number {
  // Remove 0x prefix if present
  const cleanHex = hexId.startsWith('0x') ? hexId.slice(2) : hexId;
  return Number(BigInt('0x' + cleanHex));
}

/**
 * Process a single position and return its data
 */
async function processPosition(
  provider: any,
  position: PositionData,
  positionId: number
) {
  const poolKeyData = position.pool_key;
  const token0_address = poolKeyData.token0;
  const token1_address = poolKeyData.token1;

  // Convert fee from hex string to number, then to percent
  const fee = convertFeeU128ToPercent(BigInt(poolKeyData.fee).toString());

  // Convert tick_spacing from hex string
  const tickSpacingHex = poolKeyData.tick_spacing;
  const tick_spacing = convertTickSpacingExponentToPercent(
    Number(BigInt(tickSpacingHex))
  );

  const extension = poolKeyData.extension || '0x0';

  const { poolKey, token0, token1 } = await preparePoolKeyFromParams(provider, {
    token0_address,
    token1_address,
    fee,
    tick_spacing,
    extension,
  });

  // Use bounds from API
  const lowerTick = position.bounds.lower;
  const upperTick = position.bounds.upper;

  if (isNaN(lowerTick) || isNaN(upperTick)) {
    throw new Error(
      `Invalid tick values: lower=${lowerTick}, upper=${upperTick}`
    );
  }

  if (lowerTick >= upperTick) {
    throw new Error(
      `Lower tick (${lowerTick}) must be less than upper tick (${upperTick})`
    );
  }

  // Build bounds from ticks
  const bounds = buildBounds(lowerTick, upperTick);

  const positionsContract = await getContract(provider, 'positions');
  const positionResult = await positionsContract.get_token_info(
    positionId,
    poolKey,
    bounds
  );

  return {
    position_id: positionId,
    owner_address: position.positions_address,
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
  };
}

export const getPositions = async (
  env: onchainRead,
  params: GetPositionsSchema
) => {
  const provider = env.provider;
  try {
    const positionsNFTContract = await getContract(provider, 'positionsNFT');

    let ownerAddress: string;
    let targetPositionId: number | undefined;

    if (params.owner_address && params.position_id) {
      ownerAddress = params.owner_address;
      targetPositionId = params.position_id;
    } else if (params.position_id) {
      const ownerResponse = await positionsNFTContract.ownerOf(
        params.position_id
      );
      ownerAddress =
        typeof ownerResponse === 'bigint'
          ? '0x' + ownerResponse.toString(16).padStart(64, '0')
          : ownerResponse.toString();
      targetPositionId = params.position_id;
    } else if (params.owner_address) {
      ownerAddress = params.owner_address;
      targetPositionId = undefined;
    } else {
      throw new Error('Either owner_address or position_id must be provided');
    }

    // Fetch positions from API
    const apiResponse = await fetchPositionData(
      ownerAddress,
      params.page,
      params.pageSize,
      params.state
    );

    // If targetPositionId is specified, filter to that specific position
    let positionsToProcess: PositionData[];
    if (targetPositionId !== undefined) {
      const targetPositionHex = '0x' + BigInt(targetPositionId).toString(16);
      const foundPosition = apiResponse.data.find(
        (pos) => pos.id.toLowerCase() === targetPositionHex.toLowerCase()
      );

      if (!foundPosition) {
        throw new Error(
          `Position with ID ${targetPositionId} (${targetPositionHex}) not found for owner ${ownerAddress}`
        );
      }

      positionsToProcess = [foundPosition];
    } else {
      positionsToProcess = apiResponse.data;
    }

    // Process all positions
    const processedPositions = await Promise.all(
      positionsToProcess.map(async (position) => {
        const positionId = hexToNumber(position.id);
        return await processPosition(provider, position, positionId);
      })
    );

    return {
      status: 'success',
      data: {
        positions: processedPositions,
      },
    };
  } catch (error: unknown) {
    console.error('Error getting positions:', error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Unknown error while getting positions';
    return {
      status: 'failure',
      error: errorMessage,
    };
  }
};
