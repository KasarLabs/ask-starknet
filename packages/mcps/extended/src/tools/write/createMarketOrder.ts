import {
  ExtendedApiEnv,
  ExtendedApiResponse,
  OrderReturn,
  AccountInfo,
} from '../../lib/types/index.js';
import { apiPost, apiGet } from '../../lib/utils/api.js';
import { CreateMarketOrderSchema } from '../../schemas/index.js';
import { toolResult } from '@kasarlabs/ask-starknet-core';
import {
  roundToMinChange,
  Decimal,
  createOrderContext,
  Order,
  axiosClient,
} from '../../lib/utils/lib-extended/index.js';

export const createMarketOrder = async (
  env: ExtendedApiEnv,
  params: CreateMarketOrderSchema
): Promise<toolResult> => {
  try {
    if (!env.privateKey) {
      throw new Error('EXTENDED_PRIVATE_KEY is required for order creation');
    }
    axiosClient.defaults.baseURL = env.apiUrl;

    // Get user account info to retrieve vault (collateralPosition)
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

    // Convert slippage from percentage to decimal (0.75 -> 0.0075)
    const slippageDecimal = params.slippage / 100;

    // Calculate price with slippage based on side
    const basePrice =
      params.side === 'BUY'
        ? new Decimal(market.marketStats.askPrice)
        : new Decimal(market.marketStats.bidPrice);

    const orderPrice =
      params.side === 'BUY'
        ? basePrice.times(1 + slippageDecimal) // Buy: add slippage
        : basePrice.times(1 - slippageDecimal); // Sell: subtract slippage

    const ctx = createOrderContext({
      market,
      fees,
      starknetDomain,
      vaultId,
      starkPrivateKey,
      builderId: env.builderParams?.builderId,
      builderFee: env.builderParams?.builderFee,
    });
    const orderPayload = Order.create({
      marketName: params.market,
      orderType: 'MARKET',
      side: params.side,
      amountOfSynthetic: roundToMinChange(
        new Decimal(params.qty),
        new Decimal(market.tradingConfig.minOrderSizeChange),
        Decimal.ROUND_DOWN
      ),
      price: roundToMinChange(
        orderPrice,
        new Decimal(market.tradingConfig.minPriceChange),
        Decimal.ROUND_DOWN
      ),
      timeInForce: 'IOC',
      reduceOnly: params.reduce_only,
      postOnly: false,
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
    console.error('Error creating market order:', error);
    return {
      status: 'failure',
      error: error.message || 'Failed to create market order',
    };
  }
};
