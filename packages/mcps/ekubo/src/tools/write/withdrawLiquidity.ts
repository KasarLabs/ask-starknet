import { getContract } from '../../lib/utils/contracts.js';
import { preparePoolKeyFromParams } from '../../lib/utils/pools.js';
import { WithdrawLiquiditySchema } from '../../schemas/index.js';
import { buildBounds } from '../../lib/utils/liquidity.js';
import { envWrite } from '../../interfaces/index.js';

export const withdrawLiquidity = async (
  env: envWrite,
  params: WithdrawLiquiditySchema
) => {
  try {
    const account = env.account;
    const positionsContract = await getContract(env.provider, 'positions');

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

    const bounds = buildBounds(params.lower_tick, params.upper_tick);
    const liquidity = params.fees_only ? 0 : BigInt(params.liquidity_amount);
    const minToken0 = 0;
    const minToken1 = 0;
    const collectFees = params.collect_fees ?? true;

    positionsContract.connect(account);
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

    return JSON.stringify({
      status: 'success',
      data: {
        transaction_hash,
        token0: token0.symbol,
        token1: token1.symbol,
        position_id: params.position_id,
        liquidity_withdrawn: liquidity.toString(),
        fees_only: params.fees_only,
        collect_fees: collectFees,
      },
    });
  } catch (error: any) {
    return JSON.stringify({
      status: 'failure',
      error: error.message || 'Unknown error while withdrawing liquidity',
    });
  }
};
