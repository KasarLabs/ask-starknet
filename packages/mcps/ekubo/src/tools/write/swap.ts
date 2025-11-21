import { getERC20Contract, getContract } from '../../lib/utils/contracts.js';
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
  extractRequiredInput,
  createExactOutputMinimum,
} from '../../lib/utils/quote.js';
import { formatTokenAmount } from '../../lib/utils/token.js';
import { onchainWrite } from '@kasarlabs/ask-starknet-core';

/**
 * Executes a token swap on Ekubo DEX with slippage protection.
 * Supports exact input (is_amount_in=true) and exact output (is_amount_in=false) modes.
 */
export const swap = async (env: onchainWrite, params: SwapTokensSchema) => {
  try {
    const account = env.account;
    const routerContract = await getContract(
      env.provider,
      'routerV3',
      env.account
    );
    const coreContract = await getContract(env.provider, 'core', env.account);

    const { poolKey, token0, token1, isTokenALower } =
      await preparePoolKeyFromParams(env.provider, {
        token0_symbol: params.token_in_symbol,
        token0_address: params.token_in_address,
        token1_symbol: params.token_out_symbol,
        token1_address: params.token_out_address,
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

    // Direction is always based on tokenIn (the token we're selling), not tokenOut
    const isTokenInToken0 = tokenIn.address === poolKey.token0;
    const isSellingToken0 = isTokenInToken0;

    const sqrtRatioLimit = calculateSqrtRatioLimit(
      currentSqrtPrice,
      params.slippage_tolerance,
      isSellingToken0
    );

    // Convert amount from human decimals to token decimals
    const tokenForAmount = params.is_amount_in ? tokenIn : tokenOut;
    const formatAmountIn = formatTokenAmount(
      params.amount,
      tokenForAmount.decimals
    );

    // Build route node and token amount for swap
    const routeNode = buildRouteNode(poolKey, sqrtRatioLimit);
    const tokenAmount = buildTokenAmount(
      tokenForAmount.address,
      formatAmountIn,
      params.is_amount_in
    );

    // Get quote to calculate minimum output with slippage
    const quote = await getSwapQuote(routerContract, routeNode, tokenAmount);
    // Determine transfer amount and minimum output based on swap type
    let transferAmount: string;
    let minimumOutput: any;

    if (params.is_amount_in) {
      const expectedOutput = extractExpectedOutput(quote, isTokenALower);
      // Use the converted amount in token decimals for transfer
      transferAmount = formatAmountIn;
      minimumOutput = calculateMinimumOutputU256(
        expectedOutput,
        params.slippage_tolerance
      );
    } else {
      // Exact output swap: user specifies exact output amount, we need to calculate required input
      const requiredInput = extractRequiredInput(quote, isTokenInToken0);
      transferAmount = requiredInput.toString();

      // For exact output swaps, the minimum output equals the desired output
      // (slippage protection is handled by sqrtRatioLimit on the input side)
      const desiredOutput = BigInt(formatAmountIn);
      minimumOutput = createExactOutputMinimum(desiredOutput);
    }

    const tokenInContract = getERC20Contract(env.account, tokenIn.address);
    const transferCalldata = tokenInContract.populate('transfer', [
      routerContract.address,
      transferAmount,
    ]);

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
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error during swap';
    return {
      status: 'failure',
      error: errorMessage,
    };
  }
};
