import { ExtendedApiEnv, ExtendedApiResponse, OrderReturn, AccountInfo } from '../../lib/types/index.js';
import { apiPost, apiGet } from '../../lib/utils/api.js';
import { CreateLimitOrderSchema } from '../../schemas/index.js';

import { roundToMinChange,
  Decimal,
  createOrderContext,
  Order,
  axiosClient,
} from '../../lib/utils/lib-extended/index.js';

export const createLimitOrder = async (
  env: ExtendedApiEnv,
  params: CreateLimitOrderSchema
): Promise<ExtendedApiResponse<OrderReturn>> => {
  try {
    if (!env.EXTENDED_STARKKEY_PRIVATE) {
      throw new Error('EXTENDED_STARKKEY_PRIVATE is required for order creation');
    }
    axiosClient.defaults.baseURL = env.apiUrl;

    // Get user account info to retrieve vault (collateralPosition)
    const accountInfo = await apiGet<AccountInfo>(
      env,
      '/api/v1/user/account/info',
      true
    );

    const vaultId = accountInfo.l2Vault;
    const starkPrivateKey = env.EXTENDED_STARKKEY_PRIVATE as `0x${string}`;

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
    });

    // Calculate expiry time if GTT
    let expiryTime: Date | undefined;
    if (params.time_in_force === 'GTT') {
      if (!params.expiry_epoch_millis) {
        throw new Error('expiry_epoch_millis is required for GTT orders');
      }
      expiryTime = new Date(params.expiry_epoch_millis);
    }

    const orderPayload = Order.create({
      marketName: params.market,
      orderType: 'LIMIT',
      side: params.side,
      amountOfSynthetic: roundToMinChange(
        new Decimal(params.qty),
        new Decimal(market.tradingConfig.minOrderSizeChange),
        Decimal.ROUND_DOWN,
      ),
      price: roundToMinChange(
        new Decimal(params.price),
        new Decimal(market.tradingConfig.minPriceChange),
        Decimal.ROUND_DOWN,
      ),
      timeInForce: params.time_in_force,
      expiryTime,
      reduceOnly: params.reduce_only,
      postOnly: params.post_only,
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
    console.error('Error creating limit order:', error);
    return {
      status: 'failure',
      error: error.message || 'Failed to create limit order',
    };
  }
};
