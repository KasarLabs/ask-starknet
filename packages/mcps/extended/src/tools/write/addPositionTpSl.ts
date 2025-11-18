import {
  ExtendedApiEnv,
  ExtendedApiResponse,
  OrderReturn,
  AccountInfo,
} from '../../lib/types/index.js';
import { apiPost, apiGet } from '../../lib/utils/api.js';
import { AddPositionTpSlSchema } from '../../schemas/index.js';

import {
  roundToMinChange,
  Decimal,
  createOrderContext,
  Order,
  axiosClient,
} from '../../lib/utils/lib-extended/index.js';

export const addPositionTpSl = async (
  env: ExtendedApiEnv,
  params: AddPositionTpSlSchema
): Promise<ExtendedApiResponse<OrderReturn>> => {
  try {
    if (!env.privateKey) {
      throw new Error('EXTENDED_PRIVATE_KEY is required for order creation');
    }
    axiosClient.defaults.baseURL = env.apiUrl;

    // Get user account info
    const accountInfo = await apiGet<AccountInfo>(
      env,
      '/api/v1/user/account/info',
      true
    );

    const vaultId = accountInfo.l2Vault;
    const starkPrivateKey = env.privateKey as `0x${string}`;

    const markets = await apiGet<any[]>(
      env,
      `/api/v1/info/markets?market=${params.market}`,
      false
    );
    const market = markets[0];

    const feesList = await apiGet<any[]>(
      env,
      `/api/v1/user/fees?market=${params.market}`,
      true
    );
    const fees = feesList[0];

    const starknetDomain = await apiGet<any>(
      env,
      '/api/v1/info/starknet',
      false
    );

    const ctx = createOrderContext({
      market,
      fees,
      starknetDomain,
      vaultId,
      starkPrivateKey,
      builderId: env.builderParams?.builderId,
      builderFee: env.builderParams?.builderFee,
    });

    // Helper to round prices
    const roundPrice = (value: Decimal) => {
      return roundToMinChange(
        value,
        new Decimal(market.tradingConfig.minPriceChange),
        Decimal.ROUND_DOWN
      );
    };

    // Build TP/SL configurations
    const takeProfit = params.take_profit
      ? {
          triggerPrice: roundPrice(
            new Decimal(params.take_profit.trigger_price)
          ),
          triggerPriceType: params.take_profit.trigger_price_type,
          price: roundPrice(new Decimal(params.take_profit.price)),
          priceType: params.take_profit.price_type,
        }
      : undefined;

    const stopLoss = params.stop_loss
      ? {
          triggerPrice: roundPrice(new Decimal(params.stop_loss.trigger_price)),
          triggerPriceType: params.stop_loss.trigger_price_type,
          price: roundPrice(new Decimal(params.stop_loss.price)),
          priceType: params.stop_loss.price_type,
        }
      : undefined;

    const orderPayload = Order.create({
      marketName: params.market,
      orderType: 'TPSL',
      side: params.side,
      amountOfSynthetic: roundToMinChange(
        new Decimal(params.qty),
        new Decimal(market.tradingConfig.minOrderSizeChange),
        Decimal.ROUND_DOWN
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

    const data = await apiPost<OrderReturn>(
      env,
      '/api/v1/user/order',
      orderPayload
    );

    return {
      status: 'success',
      data,
    };
  } catch (error: any) {
    console.error('Error creating position TP/SL:', error);
    return {
      status: 'failure',
      error: error.message || 'Failed to create position TP/SL',
    };
  }
};
