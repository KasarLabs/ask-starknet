import { ExtendedApiEnv, ExtendedApiResponse, Order, AccountInfo } from '../../lib/types/index.js';
import { apiPost, apiGet } from '../../lib/utils/api.js';
import { CreateMarketOrderSchema } from '../../schemas/index.js';
import { signOrderMessage, createOrderMessageHash } from '../../lib/utils/signature.js';

export const createMarketOrder = async (
  env: ExtendedApiEnv,
  params: CreateMarketOrderSchema
): Promise<ExtendedApiResponse<Order>> => {
  try {
    if (!env.STARKNET_PRIVATE_KEY) {
      throw new Error('STARKNET_PRIVATE_KEY is required for order creation');
    }

    // Get user account info to retrieve vault (collateralPosition)
    const accountInfoResponse = await apiGet<{ data: AccountInfo }>(
      env,
      '/api/v1/user/account/info',
      true
    );
    const vault = accountInfoResponse.data.l2Vault;

    // Get market info to retrieve mark price
    let marketInfoResponse;
    try {
      marketInfoResponse = await apiGet<{
        status: string;
        data: Array<{
          name: string;
          marketStats: {
            markPrice: string;
          };
          tradingConfig: {
            limitPriceCap: string;
            limitPriceFloor: string;
            minPriceChange: string;
          };
        }>;
      }>(
        env,
        `/api/v1/info/markets?market=${params.market}`,
        false
      );
    } catch (error: any) {
      console.error('Error fetching market info:', error);
      throw new Error(`Failed to fetch market info for ${params.market}: ${error.message}`);
    }

    if (marketInfoResponse.status !== 'OK' || !marketInfoResponse.data || marketInfoResponse.data.length === 0) {
      throw new Error(`Failed to fetch market info for ${params.market}: Invalid response status or empty data`);
    }

    const marketData = marketInfoResponse.data[0];
    const markPrice = parseFloat(marketData.marketStats.markPrice);
    const limitPriceCap = parseFloat(marketData.tradingConfig.limitPriceCap);
    const limitPriceFloor = parseFloat(marketData.tradingConfig.limitPriceFloor);

    // Generate nonce (must be >= 1 and <= 2^31)
    const nonce = params.nonce || Math.floor(Math.random() * Math.pow(2, 31)) + 1;

    // Market orders still need an expiry (default to 1 hour from now)
    const expiryEpochMillis = Date.now() + (60 * 60 * 1000);

    // Market orders need a price for signature
    // For BUY: use Mark Price * (1 + Limit Price Cap) - slightly below the max
    // For SELL: use Mark Price * (1 - Limit Price Floor) - slightly above the min
    // We use 95% of the allowed range to avoid edge case rejections
    const priceMultiplier = params.side === 'BUY'
      ? 1 + (limitPriceCap * 0.95)
      : 1 - (limitPriceFloor * 0.95);

    // Round to the minimum price change precision (0.01 for ETH-USD)
    // The minPriceChange defines the minimum increment
    const rawPrice = markPrice * priceMultiplier;
    const minPriceChange = parseFloat(marketData.tradingConfig.minPriceChange);
    const signaturePrice = (Math.round(rawPrice / minPriceChange) * minPriceChange).toFixed(2);

    // Create message hash for signing
    const messageHash = createOrderMessageHash({
      market: params.market,
      side: params.side,
      price: signaturePrice,
      quantity: params.qty,
      nonce,
      expiryEpochMillis,
    });

    // Sign the order
    const signature = signOrderMessage(env.STARKNET_PRIVATE_KEY, messageHash);
    console.error(signature);
    // Build order payload - all fields are required including price for market orders
    const orderPayload = {
      id: params.external_id,
      market: params.market,
      type: 'MARKET',
      side: params.side,
      qty: params.qty,
      price: signaturePrice, // Required even for market orders
      timeInForce: 'IOC', // Market orders must use IOC (Immediate or Cancel)
      expiryEpochMillis,
      fee: '0.001', // 0.1% default fee (adjust based on Extended's fee structure)
      nonce: nonce.toString(),
      reduceOnly: params.reduce_only || false,
      selfTradeProtectionLevel: 'ACCOUNT',
      settlement: {
        starkKey: signature.starkKey,
        signature: {
          r: signature.r,
          s: signature.s,
        },
        collateralPosition: vault,
      },
    };

    const response = await apiPost<{ data: Order }>(
      env,
      '/api/v1/user/order',
      orderPayload
    );

    return {
      status: 'success',
      data: response.data,
    };
  } catch (error: any) {
    console.error('Error creating market order:', error);
    return {
      status: 'failure',
      error: error.message || 'Failed to create market order',
    };
  }
};
