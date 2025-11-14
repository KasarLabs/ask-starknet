import { getERC20Contract } from '../../lib/utils/contracts.js';
import { getContract } from '../../lib/utils/contracts.js';
import { SwapTokensSchema } from '../../schemas/index.js';
import { preparePoolKeyFromParams } from '../../lib/utils/pools.js';
import {
  buildRouteNode,
  buildTokenAmount,
  calculateSqrtRatioLimit,
} from '../../lib/utils/swap.js';
import {
  getSwapQuote,
  extractExpectedOutput,
  calculateMinimumOutputU256,
} from '../../lib/utils/quote.js';
import { onchainWrite, toolResult } from '@kasarlabs/ask-starknet-core';

export const swap = async (env: onchainWrite, params: SwapTokensSchema): Promise<toolResult> => {
  return {
    status: 'failure',
    error: 'This tool is currently under maintenance. ',
  };
  try {
    const account = env.account;
    const routerContract = await getContract(env.provider, 'routerV3');
    const coreContract = await getContract(env.provider, 'core');

    const { poolKey, token0, token1, isTokenALower } =
      await preparePoolKeyFromParams(env.provider, {
        token0: params.token_in,
        token1: params.token_out,
        fee: params.fee,
        tick_spacing: params.tick_spacing,
        extension: params.extension,
      });

    // token0 is always params.token_in, token1 is always params.token_out
    const tokenIn = token0;
    const tokenOut = token1;

    // Get current pool price and calculate sqrt_ratio_limit with slippage
    const priceResult = await coreContract.get_pool_price(poolKey);
    const currentSqrtPrice = BigInt(priceResult.sqrt_ratio);
    const sqrtRatioLimit = calculateSqrtRatioLimit(
      currentSqrtPrice,
      params.slippage_tolerance,
      isTokenALower
    );

    // Build route node and token amount for swap
    const routeNode = buildRouteNode(poolKey, sqrtRatioLimit);
    const tokenAmount = buildTokenAmount(
      tokenIn.address,
      params.amount,
      params.is_amount_in
    );

    // Get quote to calculate minimum output with slippage
    const quote = await getSwapQuote(routerContract, routeNode, tokenAmount);
    const expectedOutput = extractExpectedOutput(quote, isTokenALower);
    const minimumOutput = calculateMinimumOutputU256(
      expectedOutput,
      params.slippage_tolerance
    );

    const tokenInContract = getERC20Contract(tokenIn.address, env.provider);
    tokenInContract.connect(account);
    const transferCalldata = tokenInContract.populate('transfer', [
      routerContract.address,
      params.amount,
    ]);

    routerContract.connect(account);
    const swapCalldata = routerContract.populate('swap', [
      routeNode,
      tokenAmount,
    ]);

    const clearMinimumCalldata = routerContract.populate('clear_minimum', [
      { contract_address: tokenOut.address },
      minimumOutput,
    ]);

    const clearCalldata = routerContract.populate('clear', [
      { contract_address: tokenOut.address },
    ]);

    const { transaction_hash } = await account.execute([
      transferCalldata,
      swapCalldata,
      clearMinimumCalldata,
      clearCalldata,
    ]);

    const receipt = await account.waitForTransaction(transaction_hash);
    if (!receipt.isSuccess()) {
      throw new Error('Transaction confirmed but failed');
    }

    return {
      status: 'success',
      data: {
        transaction_hash: transaction_hash,
        token_in: tokenIn.symbol,
        token_out: tokenOut.symbol,
        amount: params.amount,
        is_amount_in: params.is_amount_in,
        pool_fee: params.fee,
        slippage_tolerance: params.slippage_tolerance,
      },
    };
  } catch (error: any) {
    // console.error('Error swapping tokens:', error);
    return {
      status: 'failure',
      error: error.message || 'Unknown error during swap',
    };
  }
};
