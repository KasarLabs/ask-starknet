import { RpcProvider, Contract, cairo } from 'starknet';
import { IBaseToken } from '../../interfaces/index.js';
import {
  EkuboQuote,
  EkuboQuoteType,
  EkuboSplit,
  EkuboRoute,
  EkuboPoolKey,
} from './ekubo.js';
import { EKUBO_ROUTER_ADDRESSES } from '../constants/index.js';
import { routerAbi } from '../abis/routerAbi.js';

/**
 * Get the chain ID from provider
 */
async function getChainId(provider: RpcProvider): Promise<string> {
  return await provider.getChainId();
}

/**
 * Get Ekubo Router contract address based on chain
 */
function getRouterAddress(): string {
  return EKUBO_ROUTER_ADDRESSES.mainnet;
}

/**
 * Build a Swap structure for Ekubo Router
 */
function buildSwap(
  tokenIn: IBaseToken,
  amount: bigint,
  isExactIn: boolean,
  routes: EkuboRoute[]
): any {
  return {
    token_amount: {
      token: tokenIn.address,
      amount: {
        mag: cairo.uint256(amount.toString()),
        sign: !isExactIn, // false = exactIn, true = exactOut
      },
    },
    route: routes.map((route) => ({
      pool_key: {
        token0: route.poolKey.token0,
        token1: route.poolKey.token1,
        fee: route.poolKey.fee,
        tick_spacing: route.poolKey.tickSpacing,
        extension: route.poolKey.extension,
      },
      sqrt_ratio_limit: cairo.uint256(route.sqrtRatioLimit.toString()),
      skip_ahead: route.skipAhead,
    })),
  };
}

/**
 * Convert Delta response to calculated amount
 * Delta represents the change in token amounts in the pool
 * For a swap: we give one token (negative delta) and receive another (positive delta)
 */
function extractCalculatedAmount(
  deltas: any[],
  tokenIn: IBaseToken,
  tokenOut: IBaseToken,
  isExactIn: boolean,
  route?: EkuboRoute[]
): bigint {
  if (deltas.length === 0) {
    throw new Error('Empty deltas array: no swap deltas returned');
  }

  // For multihop routes, we need to trace through the path
  // If we have route information, use it to determine token flow
  if (route && route.length > 1) {
    return extractMultihopAmount(deltas, tokenIn, tokenOut, isExactIn, route);
  }

  // For single-hop routes, validate that we have exactly one delta
  if (route && route.length === 1 && deltas.length !== 1) {
    throw new Error(
      `Single-hop route expected 1 delta, but got ${deltas.length} deltas`
    );
  }

  // For single-hop routes, use the last (and only) delta
  const delta = deltas[deltas.length - 1];
  const amount0 = BigInt(delta.amount0.mag);
  const amount1 = BigInt(delta.amount1.mag);

  // Determine token order (token0 is always the lower address)
  const isToken0Lower =
    tokenIn.address.toLowerCase() < tokenOut.address.toLowerCase();

  if (isExactIn) {
    // We want the output amount (positive delta for tokenOut)
    if (isToken0Lower) {
      // tokenIn is token0, tokenOut is token1
      // We should receive token1 (positive amount1, sign = false)
      if (delta.amount1.sign) {
        throw new Error(
          `Unexpected delta sign for tokenOut: expected positive (sign=false), got negative (sign=true). ` +
            `amount0: ${amount0}, amount1: ${amount1}, amount0.sign: ${delta.amount0.sign}, amount1.sign: ${delta.amount1.sign}`
        );
      }
      return amount1;
    } else {
      // tokenIn is token1, tokenOut is token0
      // We should receive token0 (positive amount0, sign = false)
      if (delta.amount0.sign) {
        throw new Error(
          `Unexpected delta sign for tokenOut: expected positive (sign=false), got negative (sign=true). ` +
            `amount0: ${amount0}, amount1: ${amount1}, amount0.sign: ${delta.amount0.sign}, amount1.sign: ${delta.amount1.sign}`
        );
      }
      return amount0;
    }
  } else {
    // We want the input amount (negative delta for tokenIn)
    if (isToken0Lower) {
      // tokenIn is token0, we give token0 (negative amount0, sign = true)
      if (!delta.amount0.sign) {
        throw new Error(
          `Unexpected delta sign for tokenIn: expected negative (sign=true), got positive (sign=false). ` +
            `amount0: ${amount0}, amount1: ${amount1}, amount0.sign: ${delta.amount0.sign}, amount1.sign: ${delta.amount1.sign}`
        );
      }
      return amount0;
    } else {
      // tokenIn is token1, we give token1 (negative amount1, sign = true)
      if (!delta.amount1.sign) {
        throw new Error(
          `Unexpected delta sign for tokenIn: expected negative (sign=true), got positive (sign=false). ` +
            `amount0: ${amount0}, amount1: ${amount1}, amount0.sign: ${delta.amount0.sign}, amount1.sign: ${delta.amount1.sign}`
        );
      }
      return amount1;
    }
  }
}

/**
 * Extract amount from multihop route by tracing through all deltas
 * For multihop: TokenA -> TokenB -> TokenC
 * - Delta[0]: TokenA (negative) -> TokenB (positive)
 * - Delta[1]: TokenB (negative) -> TokenC (positive)
 */
function extractMultihopAmount(
  deltas: any[],
  tokenIn: IBaseToken,
  tokenOut: IBaseToken,
  isExactIn: boolean,
  route: EkuboRoute[]
): bigint {
  if (deltas.length !== route.length) {
    throw new Error(
      `Mismatch between deltas (${deltas.length}) and route length (${route.length})`
    );
  }

  if (isExactIn) {
    // For exactIn, we want the final output token amount
    // This is the positive delta in the last pool
    const lastDelta = deltas[deltas.length - 1];
    const lastPoolKey = route[route.length - 1].poolKey;

    // Determine which token is tokenOut in the last pool
    const isToken0Out =
      tokenOut.address.toLowerCase() === lastPoolKey.token0.toLowerCase();
    const isToken1Out =
      tokenOut.address.toLowerCase() === lastPoolKey.token1.toLowerCase();

    if (!isToken0Out && !isToken1Out) {
      throw new Error(
        `TokenOut ${tokenOut.address} not found in last pool (token0: ${lastPoolKey.token0}, token1: ${lastPoolKey.token1})`
      );
    }

    const amount0 = BigInt(lastDelta.amount0.mag);
    const amount1 = BigInt(lastDelta.amount1.mag);

    if (isToken0Out) {
      // tokenOut is token0, should have positive delta (sign = false)
      if (lastDelta.amount0.sign) {
        throw new Error(
          `Unexpected delta sign for tokenOut in last pool: expected positive (sign=false), got negative (sign=true). ` +
            `amount0: ${amount0}, amount1: ${amount1}`
        );
      }
      return amount0;
    } else {
      // tokenOut is token1, should have positive delta (sign = false)
      if (lastDelta.amount1.sign) {
        throw new Error(
          `Unexpected delta sign for tokenOut in last pool: expected positive (sign=false), got negative (sign=true). ` +
            `amount0: ${amount0}, amount1: ${amount1}`
        );
      }
      return amount1;
    }
  } else {
    // For exactOut, we want the initial input token amount
    // This is the negative delta in the first pool
    const firstDelta = deltas[0];
    const firstPoolKey = route[0].poolKey;

    // Determine which token is tokenIn in the first pool
    const isToken0In =
      tokenIn.address.toLowerCase() === firstPoolKey.token0.toLowerCase();
    const isToken1In =
      tokenIn.address.toLowerCase() === firstPoolKey.token1.toLowerCase();

    if (!isToken0In && !isToken1In) {
      throw new Error(
        `TokenIn ${tokenIn.address} not found in first pool (token0: ${firstPoolKey.token0}, token1: ${firstPoolKey.token1})`
      );
    }

    const amount0 = BigInt(firstDelta.amount0.mag);
    const amount1 = BigInt(firstDelta.amount1.mag);

    if (isToken0In) {
      // tokenIn is token0, should have negative delta (sign = true)
      if (!firstDelta.amount0.sign) {
        throw new Error(
          `Unexpected delta sign for tokenIn in first pool: expected negative (sign=true), got positive (sign=false). ` +
            `amount0: ${amount0}, amount1: ${amount1}`
        );
      }
      return amount0;
    } else {
      // tokenIn is token1, should have negative delta (sign = true)
      if (!firstDelta.amount1.sign) {
        throw new Error(
          `Unexpected delta sign for tokenIn in first pool: expected negative (sign=true), got positive (sign=false). ` +
            `amount0: ${amount0}, amount1: ${amount1}`
        );
      }
      return amount1;
    }
  }
}

/**
 * Get Ekubo quote for a swap with multiple routes (splits)
 *
 * @param provider - RPC provider
 * @param tokenIn - Input token
 * @param tokenOut - Output token
 * @param amount - Amount to swap
 * @param isExactIn - Whether amount is exact input (true) or exact output (false)
 * @param routes - Array of route configurations (splits)
 * @returns EkuboQuote with splits and calculated amounts
 */
export async function getEkuboQuote(
  provider: RpcProvider,
  tokenIn: IBaseToken,
  tokenOut: IBaseToken,
  amount: bigint,
  isExactIn: boolean,
  routes: EkuboRoute[]
): Promise<EkuboQuote> {
  try {
    const routerAddress = getRouterAddress();

    // Create router contract
    const routerContract = new Contract(routerAbi, routerAddress, provider);

    // Build swaps for each route (split)
    // Note: Each route can be a single-hop or multihop path
    const swaps = routes.map((route) =>
      buildSwap(tokenIn, amount, isExactIn, [route])
    );

    // Get quote from router
    const quoteResult = await routerContract.quote_multi_multihop_swap(swaps);

    // Process the quote result to extract splits
    const splits: EkuboSplit[] = [];
    let totalCalculated = 0n;

    for (let i = 0; i < quoteResult.length; i++) {
      const deltas = quoteResult[i];
      const route = routes[i];

      // Pass the route array to handle multihop routes correctly
      // For single-hop, this will be [route], for multihop it could be multiple routes
      const routeArray = [route];
      const amountCalculated = extractCalculatedAmount(
        deltas,
        tokenIn,
        tokenOut,
        isExactIn,
        routeArray
      );

      splits.push({
        amountSpecified: amount,
        amountCalculated,
        route: [route],
      });

      totalCalculated += amountCalculated;
    }

    return {
      type: isExactIn ? 'exactIn' : 'exactOut',
      splits,
      totalCalculated,
      priceImpact: null, // Could be calculated from price difference
    };
  } catch (error: any) {
    return {
      type: isExactIn ? 'exactIn' : 'exactOut',
      splits: [],
      totalCalculated: 0n,
      priceImpact: null,
      error: error.message || 'Failed to get Ekubo quote',
    };
  }
}

/**
 * Get Ekubo quote with a single route (simplified version)
 *
 * @param provider - RPC provider
 * @param tokenIn - Input token
 * @param tokenOut - Output token
 * @param amount - Amount to swap
 * @param isExactIn - Whether amount is exact input (true) or exact output (false)
 * @param poolKey - Pool key configuration
 * @param sqrtRatioLimit - Sqrt ratio limit for slippage
 * @param skipAhead - Skip ahead value (default 0)
 * @returns EkuboQuote
 */
export async function getEkuboQuoteSimple(
  provider: RpcProvider,
  tokenIn: IBaseToken,
  tokenOut: IBaseToken,
  amount: bigint,
  isExactIn: boolean,
  poolKey: EkuboPoolKey,
  sqrtRatioLimit: bigint,
  skipAhead: bigint = 0n
): Promise<EkuboQuote> {
  const route: EkuboRoute = {
    poolKey,
    sqrtRatioLimit,
    skipAhead,
  };

  return getEkuboQuote(provider, tokenIn, tokenOut, amount, isExactIn, [route]);
}
