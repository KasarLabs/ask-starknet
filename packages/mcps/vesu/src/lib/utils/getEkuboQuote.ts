import { RpcProvider, Contract, cairo } from 'starknet';
import { IBaseToken } from '../../interfaces/index.js';
import { EkuboQuote, EkuboSplit, EkuboRoute, safeStringify } from './ekubo.js';

/**
 * Get Ekubo quote using HTTP API and parse the response directly
 * This function parses the API response like deposit_multiply and withdraw_multiply do
 *
 * @param provider - RPC provider (not used, kept for compatibility)
 * @param tokenIn - Input token
 * @param tokenOut - Output token
 * @param amount - Amount to swap (for exactOut, this is the output amount we want)
 * @param isExactIn - Whether amount is exact input (true) or exact output (false)
 * @param ekuboQuoterUrl - URL to Ekubo quoter API (optional, defaults to mainnet)
 * @returns EkuboQuote
 */
export async function getEkuboQuoteFromAPI(
  provider: RpcProvider,
  tokenIn: IBaseToken,
  tokenOut: IBaseToken,
  amount: bigint,
  isExactIn: boolean,
  ekuboQuoterUrl?: string
): Promise<EkuboQuote> {
  console.error('=== getEkuboQuoteFromAPI START ===');
  console.error('tokenIn:', safeStringify(tokenIn));
  console.error('tokenOut:', safeStringify(tokenOut));
  console.error('amount:', amount.toString());
  console.error('isExactIn:', isExactIn);
  console.error('ekuboQuoterUrl:', ekuboQuoterUrl);

  // Use API to get quote with pool parameters
  const baseUrl =
    ekuboQuoterUrl || 'https://starknet-mainnet-quoter-api.ekubo.org';
  // API always expects negative amount
  const apiAmount = amount;
  const url = `${baseUrl}/${apiAmount}/${tokenIn.address}/${tokenOut.address}`;
  console.error('Ekubo API URL:', url);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Ekubo API request failed with status ${response.status}`);
  }

  const ekuboData = await response.json();
  console.error('ekuboData raw:', safeStringify(ekuboData));

  if (!ekuboData.splits || ekuboData.splits.length === 0) {
    throw new Error('No splits found in Ekubo API response');
  }

  // Parse Ekubo response and extract pool parameters (same as deposit_multiply and withdraw_multiply)
  const splits: EkuboSplit[] = ekuboData.splits.map((splitData: any) => {
    const amountSpecified = BigInt(splitData.amount_specified);
    const amountCalculated = BigInt(splitData.amount_calculated);
    const routes: EkuboRoute[] = splitData.route.map(
      (routeData: any, routeIdx: number) => {
        // Handle fee: u128 parameter, can be number, string, or object {low, high}
        // If object, use only low (u128 doesn't have high part)
        let feeValue: bigint;
        if (
          typeof routeData.pool_key.fee === 'object' &&
          routeData.pool_key.fee !== null
        ) {
          const feeObj = routeData.pool_key.fee as {
            low?: any;
            high?: any;
          };
          if (feeObj.low !== undefined) {
            feeValue = BigInt(feeObj.low);
          } else {
            throw new Error(
              `route[${routeIdx}].pool_key.fee is an object but missing low: ${safeStringify(routeData.pool_key.fee)}`
            );
          }
        } else {
          feeValue = BigInt(routeData.pool_key.fee);
        }

        // Handle tick_spacing: u128 parameter, can be number, string, or object {low, high}
        // If object, use only low (u128 doesn't have high part)
        let tickSpacingValue: bigint;
        if (
          typeof routeData.pool_key.tick_spacing === 'object' &&
          routeData.pool_key.tick_spacing !== null
        ) {
          const tickSpacingObj = routeData.pool_key.tick_spacing as {
            low?: any;
            high?: any;
          };
          if (tickSpacingObj.low !== undefined) {
            tickSpacingValue = BigInt(tickSpacingObj.low);
          } else {
            throw new Error(
              `route[${routeIdx}].pool_key.tick_spacing is an object but missing low: ${safeStringify(routeData.pool_key.tick_spacing)}`
            );
          }
        } else {
          tickSpacingValue = BigInt(routeData.pool_key.tick_spacing);
        }

        // Handle extension: normalize to full hex string
        let extensionValue = routeData.pool_key.extension || '0x0';
        if (extensionValue === '0x0' || extensionValue === '0x') {
          extensionValue =
            '0x0000000000000000000000000000000000000000000000000000000000000000';
        } else if (!extensionValue.startsWith('0x')) {
          extensionValue = `0x${extensionValue}`;
        }
        // Pad extension to 66 chars (0x + 64 hex chars)
        if (extensionValue.length < 66) {
          const withoutPrefix = extensionValue.slice(2);
          extensionValue = `0x${withoutPrefix.padStart(64, '0')}`;
        }

        // Handle sqrt_ratio_limit
        let sqrtRatioLimitValue: bigint;
        if (
          typeof routeData.sqrt_ratio_limit === 'object' &&
          routeData.sqrt_ratio_limit !== null
        ) {
          const { low, high } = routeData.sqrt_ratio_limit;
          if (low !== undefined && high !== undefined) {
            sqrtRatioLimitValue = BigInt(low) + BigInt(high) * 2n ** 128n;
          } else {
            sqrtRatioLimitValue = 2n ** 128n;
          }
        } else if (routeData.sqrt_ratio_limit) {
          sqrtRatioLimitValue = BigInt(routeData.sqrt_ratio_limit);
        } else {
          sqrtRatioLimitValue = 2n ** 128n;
        }

        // Handle skip_ahead: u128 parameter, can be number, string, or object {low, high}
        // If object, use only low (u128 doesn't have high part)
        let skipAheadValue: bigint;
        if (
          typeof routeData.skip_ahead === 'object' &&
          routeData.skip_ahead !== null
        ) {
          const skipAheadObj = routeData.skip_ahead as {
            low?: any;
            high?: any;
          };
          if (skipAheadObj.low !== undefined) {
            skipAheadValue = BigInt(skipAheadObj.low);
          } else {
            skipAheadValue = 0n;
          }
        } else {
          skipAheadValue = BigInt(routeData.skip_ahead || 0);
        }

        return {
          poolKey: {
            token0: routeData.pool_key.token0,
            token1: routeData.pool_key.token1,
            fee: feeValue,
            tickSpacing: tickSpacingValue,
            extension: extensionValue,
          },
          sqrtRatioLimit: sqrtRatioLimitValue,
          skipAhead: skipAheadValue,
        };
      }
    );

    return {
      amountSpecified,
      amountCalculated,
      route: routes,
    };
  });

  const totalCalculatedRaw = BigInt(ekuboData.total_calculated);
  const totalCalculated =
    totalCalculatedRaw < 0n ? -totalCalculatedRaw : totalCalculatedRaw;

  const quote: EkuboQuote = {
    type: 'exactIn',
    splits,
    totalCalculated,
    priceImpact: ekuboData.price_impact || null,
  };
  console.error('=== getEkuboQuoteFromAPI END ===');
  console.error('Returning quote:', {
    type: quote.type,
    totalCalculated: quote.totalCalculated.toString(),
    splitsCount: quote.splits.length,
    priceImpact: quote.priceImpact,
  });
  return quote;
}
