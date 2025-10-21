import { ExtendedApiEnv, ExtendedApiResponse, OrderReturn, AccountInfo } from '../../lib/types/index.js';
import { apiPost, apiGet } from '../../lib/utils/api.js';
import { CreateMarketOrderSchema } from '../../schemas/index.js';

import { roundToMinChange,
  Decimal,
  init,
  getMarket,
  getFees,
  getStarknetDomain,
  createOrderContext,
  Order,
 } from '@snaknet/lib-extended';

const SLIPPAGE = 0.0075

export const createMarketOrder = async (
  env: ExtendedApiEnv,
  params: CreateMarketOrderSchema
): Promise<ExtendedApiResponse<OrderReturn>> => {
  try {
    if (!env.EXTENDED_STARKKEY_PRIVATE) {
      throw new Error('EXTENDED_STARKKEY_PRIVATE is required for order creation');
    }

    // Get user account info to retrieve vault (collateralPosition)
    const accountInfoResponse = await apiGet<{ data: AccountInfo }>(
      env,
      '/api/v1/user/account/info',
      true
    );
    const vault = accountInfoResponse.data.l2Vault;

      const { starkPrivateKey, vaultId } = await init()

    const market = await getMarket(params.market)
    const fees = await getFees({ marketName: params.market })
    const starknetDomain = await getStarknetDomain()

    const orderSize = market.tradingConfig.minOrderSize
    const orderPrice = (market.marketStats as any).askPrice.times(1 + SLIPPAGE)

    const ctx = createOrderContext({
      market,
      fees,
      starknetDomain,
      vaultId,
      starkPrivateKey,
    })
    const orderPayload = Order.create({
      marketName: params.market,
      orderType: 'MARKET',
      side: 'BUY',
      amountOfSynthetic: roundToMinChange(
        orderSize,
        market.tradingConfig.minOrderSizeChange,
        Decimal.ROUND_DOWN,
      ),
      price: roundToMinChange(
        orderPrice,
        market.tradingConfig.minPriceChange,
        Decimal.ROUND_DOWN,
      ),
      timeInForce: 'IOC',
      reduceOnly: false,
      postOnly: false,
      ctx,
    })

    const response = await apiPost<{ data: OrderReturn }>(
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
