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
function getRouterAddress(chainId: string): string {
  // Check if it's mainnet (SN_MAIN) or sepolia
  if (chainId.includes('MAIN') || chainId === '0x534e5f4d41494e') {
    return EKUBO_ROUTER_ADDRESSES.mainnet;
  }
  return EKUBO_ROUTER_ADDRESSES.sepolia;
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
        mag: amount,
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
  isExactIn: boolean
): bigint {
  if (deltas.length === 0) return 0n;

  // Determine token order (token0 is always the lower address)
  const isToken0Lower =
    tokenIn.address.toLowerCase() < tokenOut.address.toLowerCase();

  // For multihop, we need to look at the last delta (final output)
  // or sum all deltas depending on the route structure
  // For simplicity, we'll use the last delta which represents the final pool
  const lastDelta = deltas[deltas.length - 1];

  const amount0 = BigInt(lastDelta.amount0.mag);
  const amount1 = BigInt(lastDelta.amount1.mag);

  // Delta signs: false = positive (receiving), true = negative (giving)
  // For exactIn: we give tokenIn (negative) and receive tokenOut (positive)
  // For exactOut: we give tokenIn (negative) and receive tokenOut (positive)

  if (isExactIn) {
    // We want the output amount (positive delta for tokenOut)
    if (isToken0Lower) {
      // tokenIn is token0, tokenOut is token1
      // We receive token1 (positive amount1)
      return !lastDelta.amount1.sign ? amount1 : 0n;
    } else {
      // tokenIn is token1, tokenOut is token0
      // We receive token0 (positive amount0)
      return !lastDelta.amount0.sign ? amount0 : 0n;
    }
  } else {
    // We want the input amount (negative delta for tokenIn)
    if (isToken0Lower) {
      // tokenIn is token0, we give token0 (negative amount0)
      return lastDelta.amount0.sign ? amount0 : 0n;
    } else {
      // tokenIn is token1, we give token1 (negative amount1)
      return lastDelta.amount1.sign ? amount1 : 0n;
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
    const chainId = await getChainId(provider);
    const routerAddress = getRouterAddress(chainId);

    // Create router contract
    const routerContract = new Contract(routerAbi, routerAddress, provider);

    // Build swaps for each route (split)
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

      const amountCalculated = extractCalculatedAmount(
        deltas,
        tokenIn,
        tokenOut,
        isExactIn
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
