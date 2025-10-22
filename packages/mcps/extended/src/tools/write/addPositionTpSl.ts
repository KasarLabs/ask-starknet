import { ExtendedApiEnv, ExtendedApiResponse, OrderReturn, AccountInfo } from '../../lib/types/index.js';
import { apiPost, apiGet } from '../../lib/utils/api.js';
import { AddPositionTpSlSchema } from '../../schemas/index.js';

import { roundToMinChange,
  Decimal,
  createOrderContext,
  Order,
  axiosClient,
} from '@snaknet/lib-extended';

export const addPositionTpSl = async (
  env: ExtendedApiEnv,
  params: AddPositionTpSlSchema
): Promise<ExtendedApiResponse<OrderReturn>> => {
  try {
    if (!env.EXTENDED_STARKKEY_PRIVATE) {
      throw new Error('EXTENDED_STARKKEY_PRIVATE is required for order creation');
    }
    axiosClient.defaults.baseURL = env.apiUrl;

    // Get user account info
    const accountInfoResponse = await apiGet<{ data: AccountInfo }>(
      env,
      '/api/v1/user/account/info',
      true
    );

    const vaultId = accountInfoResponse.data.l2Vault;
    const starkPrivateKey = env.EXTENDED_STARKKEY_PRIVATE as `0x${string}`;

    const marketResponse = await apiGet<{ data: any[] }>(
      env,
      `/api/v1/info/markets?market=${params.market}`,
      false
    );
    const market = marketResponse.data[0];

    const feesResponse = await apiGet<{ data: any[] }>(
      env,
      `/api/v1/user/fees?market=${params.market}`,
      true
    );
    const fees = feesResponse.data[0];

    const starknetDomainResponse = await apiGet<{ data: any }>(
      env,
      '/api/v1/info/starknet',
      false
    );
    const starknetDomain = starknetDomainResponse.data;

    const ctx = createOrderContext({
      market,
      fees,
      starknetDomain,
      vaultId,
      starkPrivateKey,
    });

    // Helper to round prices
    const roundPrice = (value: Decimal) => {
      return roundToMinChange(
        value,
        new Decimal(market.tradingConfig.minPriceChange),
        Decimal.ROUND_DOWN,
      );
    };

    // Build TP/SL configurations
    const takeProfit = params.take_profit ? {
      triggerPrice: roundPrice(new Decimal(params.take_profit.trigger_price)),
      triggerPriceType: params.take_profit.trigger_price_type,
      price: roundPrice(new Decimal(params.take_profit.price)),
      priceType: params.take_profit.price_type,
    } : undefined;

    const stopLoss = params.stop_loss ? {
      triggerPrice: roundPrice(new Decimal(params.stop_loss.trigger_price)),
      triggerPriceType: params.stop_loss.trigger_price_type,
      price: roundPrice(new Decimal(params.stop_loss.price)),
      priceType: params.stop_loss.price_type,
    } : undefined;

    const orderPayload = Order.create({
      marketName: params.market,
      orderType: 'TPSL',
      side: params.side,
      amountOfSynthetic: roundToMinChange(
        new Decimal(params.qty),
        new Decimal(market.tradingConfig.minOrderSizeChange),
        Decimal.ROUND_DOWN,
      ),
      price: new Decimal(0), // Ignored for TPSL orders
      timeInForce: 'GTT',
      reduceOnly: true, // TPSL orders must be reduce-only
      postOnly: false,
      tpSlType: 'ORDER',
      takeProfit,
      stopLoss,
      ctx,
    });

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
    console.error('Error creating position TP/SL:', error);
    return {
      status: 'failure',
      error: error.message || 'Failed to create position TP/SL',
    };
  }
};
