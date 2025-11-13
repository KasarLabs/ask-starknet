import { getERC20Contract } from '../../lib/utils/contracts.js';
import { getContract } from '../../lib/utils/contracts.js';
import { AddLiquiditySchema } from '../../schemas/index.js';
import { preparePoolKeyFromParams } from '../../lib/utils/pools.js';
import { buildBounds } from '../../lib/utils/liquidity.js';
import {
  calculateTickFromPrice,
  roundTickToSpacing,
} from '../../lib/utils/math.js';
import { onchainWrite } from '@kasarlabs/ask-starknet-core';

export const addLiquidity = async (
  env: onchainWrite,
  params: AddLiquiditySchema
) => {
  try {
    const account = env.account;
    const positionsContract = await getContract(env.provider, 'positions');

    const { poolKey, token0, token1, isTokenALower } =
      await preparePoolKeyFromParams(env.provider, {
        token0_symbol: params.token0_symbol,
        token0_address: params.token0_address,
        token1_symbol: params.token1_symbol,
        token1_address: params.token1_address,
        fee: params.fee,
        tick_spacing: params.tick_spacing,
        extension: params.extension,
      });

    const config = isTokenALower
      ? {
          lowerPrice: params.lower_price,
          upperPrice: params.upper_price,
          decimals0: token0.decimals,
          decimals1: token1.decimals,
          amount0: params.amount0,
          amount1: params.amount1,
          transferToken0: token0,
          transferToken1: token1,
        }
      : {
          lowerPrice: 1 / params.upper_price,
          upperPrice: 1 / params.lower_price,
          decimals0: token1.decimals,
          decimals1: token0.decimals,
          amount0: params.amount1,
          amount1: params.amount0,
          transferToken0: token1,
          transferToken1: token0,
        };

    const {
      lowerPrice,
      upperPrice,
      decimals0,
      decimals1,
      amount0,
      amount1,
      transferToken0,
      transferToken1,
    } = config;

    // Calculate ticks from prices
    const rawLowerTick = calculateTickFromPrice(
      lowerPrice,
      decimals0,
      decimals1
    );
    const rawUpperTick = calculateTickFromPrice(
      upperPrice,
      decimals0,
      decimals1
    );

    // Round ticks to tick spacing (required by Ekubo)
    // Use the tick spacing from poolKey to ensure consistency
    const tickSpacingExponent = poolKey.tick_spacing;
    const lowerTick = roundTickToSpacing(
      rawLowerTick,
      tickSpacingExponent,
      true
    ); // Round down for lower
    const upperTick = roundTickToSpacing(
      rawUpperTick,
      tickSpacingExponent,
      false
    ); // Round up for upper

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
        lower_price: params.lower_price,
        upper_price: params.upper_price,
        lower_tick: lowerTick,
        upper_tick: upperTick,
        pool_fee: params.fee,
      },
    };
  } catch (error: any) {
    return {
      status: 'failure',
      error: error.message || 'Unknown error while adding liquidity',
    };
  }
};
