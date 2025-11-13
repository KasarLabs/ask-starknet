import { getERC20Contract } from '../../lib/utils/contracts.js';
import { getContract } from '../../lib/utils/contracts.js';
import { AddLiquiditySchema } from '../../schemas/index.js';
import { preparePoolKeyFromParams } from '../../lib/utils/pools.js';
import { buildBounds } from '../../lib/utils/liquidity.js';
import { onchainWrite } from '@kasarlabs/ask-starknet-core';

export const addLiquidity = async (
  env: onchainWrite,
  params: AddLiquiditySchema
) => {
  // Tool under maintenance - pool initialization required
  return {
    status: 'failure',
    error: 'This tool is currently under maintenance. ',
  };

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

    const bounds = buildBounds(params.lower_tick, params.upper_tick);
    const minLiquidity = 0;

    const token0Contract = getERC20Contract(token0.address, env.provider);
    token0Contract.connect(account);
    const transfer0Calldata = token0Contract.populate('transfer', [
      positionsContract.address,
      params.amount0,
    ]);

    const token1Contract = getERC20Contract(token1.address, env.provider);
    token1Contract.connect(account);
    const transfer1Calldata = token1Contract.populate('transfer', [
      positionsContract.address,
      params.amount1,
    ]);

    positionsContract.connect(account);
    const depositCalldata = positionsContract.populate('deposit', [
      params.position_id,
      poolKey,
      bounds,
      minLiquidity,
    ]);

    const clearToken0Calldata = positionsContract.populate('clear', [
      { contract_address: token0.address },
    ]);

    const clearToken1Calldata = positionsContract.populate('clear', [
      { contract_address: token1.address },
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
        lower_tick: params.lower_tick,
        upper_tick: params.upper_tick,
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
