import { getContract } from '../../lib/utils/contracts.js';
import { preparePoolKeyFromParams } from '../../lib/utils/pools.js';
import { WithdrawLiquiditySchema } from '../../schemas/index.js';
import { buildBounds } from '../../lib/utils/liquidity.js';
import {
  convertTickSpacingExponentToPercent,
  convertFeeU128ToPercent,
} from '../../lib/utils/math.js';
import { fetchPositionDataById } from '../../lib/utils/position.js';
import { onchainWrite, toolResult } from '@kasarlabs/ask-starknet-core';

export const withdrawLiquidity = async (
  env: onchainWrite,
  params: WithdrawLiquiditySchema
): Promise<toolResult> => {
  try {
    const account = env.account;
    const positionsContract = await getContract(
      env.provider,
      'positions',
      account
    );
    const positionsNFTContract = await getContract(
      env.provider,
      'positionsNFT'
    );

    // Fetch position data from API (always 'opened' since closed positions have no liquidity)
    const positionData = await fetchPositionDataById(
      env.provider,
      positionsNFTContract,
      params.position_id,
      'opened'
    );

    // Use API data
    const token0_address = positionData.token0;
    const token1_address = positionData.token1;
    const fee = convertFeeU128ToPercent(positionData.fee);
    const tick_spacing = convertTickSpacingExponentToPercent(
      Number(positionData.tick_spacing)
    );
    const extension = positionData.extension || '0x0';

    const { poolKey, token0, token1 } = await preparePoolKeyFromParams(
      env.provider,
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

    const bounds = buildBounds(lowerTick, upperTick);
    const liquidity = params.fees_only ? 0 : BigInt(params.liquidity_amount);
    const minToken0 = 0;
    const minToken1 = 0;
    const collectFees = params.collect_fees ?? true;

    const withdrawCalldata = positionsContract.populate('withdraw', [
      params.position_id,
      poolKey,
      bounds,
      liquidity,
      minToken0,
      minToken1,
      collectFees,
    ]);

    const clearToken0Calldata = positionsContract.populate('clear', [
      { contract_address: token0.address },
    ]);

    const clearToken1Calldata = positionsContract.populate('clear', [
      { contract_address: token1.address },
    ]);

    const { transaction_hash } = await account.execute([
      withdrawCalldata,
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
        token0: token0.symbol,
        token1: token1.symbol,
        position_id: params.position_id,
        liquidity_withdrawn: liquidity.toString(),
        fees_only: params.fees_only,
        collect_fees: collectFees,
        lower_tick: lowerTick,
        upper_tick: upperTick,
      },
    };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Unknown error while withdrawing liquidity';
    return {
      status: 'failure',
      error: errorMessage,
    };
  }
};
