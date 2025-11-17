import { getERC20Contract, getContract } from '../../lib/utils/contracts.js';
import { AddLiquiditySchema } from '../../schemas/index.js';
import { preparePoolKeyFromParams } from '../../lib/utils/pools.js';
import { buildBounds } from '../../lib/utils/liquidity.js';
import {
  convertTickSpacingExponentToPercent,
  convertFeeU128ToPercent,
} from '../../lib/utils/math.js';
import { fetchPositionData } from '../../lib/utils/position.js';
import { formatTokenAmount } from '../../lib/utils/token.js';
import { onchainWrite } from '@kasarlabs/ask-starknet-core';

export const addLiquidity = async (
  env: onchainWrite,
  params: AddLiquiditySchema
) => {
  try {
    const account = env.account;
    const positionsContract = await getContract(env.provider, 'positions');

    // Fetch position data from API
    const positionData = await fetchPositionData(params.position_id);

    // Use API data
    const token0_address = positionData.token0;
    const token1_address = positionData.token1;
    const fee = convertFeeU128ToPercent(positionData.fee);
    const tick_spacing = convertTickSpacingExponentToPercent(
      Number(positionData.tick_spacing)
    );
    const extension = positionData.extension || '0x0';

    const { poolKey, token0, token1, isTokenALower } =
      await preparePoolKeyFromParams(env.provider, {
        token0_address,
        token1_address,
        fee,
        tick_spacing,
        extension,
      });

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

    // Convert amounts from human decimals to token decimals
    const formatAmount0 = formatTokenAmount(params.amount0, token0.decimals);
    const formatAmount1 = formatTokenAmount(params.amount1, token1.decimals);

    const config = isTokenALower
      ? {
          amount0: formatAmount0,
          amount1: formatAmount1,
          transferToken0: token0,
          transferToken1: token1,
        }
      : {
          amount0: formatAmount1,
          amount1: formatAmount0,
          transferToken0: token1,
          transferToken1: token0,
        };

    const { amount0, amount1, transferToken0, transferToken1 } = config;

    const bounds = buildBounds(lowerTick, upperTick);
    const minLiquidity = 0;

    const token0Contract = getERC20Contract(
      transferToken0.address,
      env.provider
    );
    token0Contract.connect(account);
    const transfer0Calldata = token0Contract.populate('transfer', [
      positionsContract.address,
      amount0,
    ]);

    const token1Contract = getERC20Contract(
      transferToken1.address,
      env.provider
    );
    token1Contract.connect(account);
    const transfer1Calldata = token1Contract.populate('transfer', [
      positionsContract.address,
      amount1,
    ]);

    positionsContract.connect(account);
    const depositCalldata = positionsContract.populate('deposit', [
      params.position_id,
      poolKey,
      bounds,
      minLiquidity,
    ]);

    const clearToken0Calldata = positionsContract.populate('clear', [
      { contract_address: transferToken0.address },
    ]);

    const clearToken1Calldata = positionsContract.populate('clear', [
      { contract_address: transferToken1.address },
    ]);

    const { transaction_hash } = await account.execute([
      transfer0Calldata,
      transfer1Calldata,
      depositCalldata,
      clearToken0Calldata,
      clearToken1Calldata,
    ]);

    const receipt = await account.waitForTransaction(transaction_hash);
    if (!receipt.isSuccess()) {
      throw new Error('Transaction confirmed but failed');
    }

    return {
      status: 'success',
      data: {
        transaction_hash,
        position_id: params.position_id,
        token0: token0.symbol,
        token1: token1.symbol,
        amount0: params.amount0,
        amount1: params.amount1,
        lower_tick: lowerTick,
        upper_tick: upperTick,
        pool_fee: fee,
      },
    };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Unknown error while adding liquidity';
    return {
      status: 'failure',
      error: errorMessage,
    };
  }
};
