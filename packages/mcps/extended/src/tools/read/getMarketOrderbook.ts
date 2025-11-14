import { ExtendedApiEnv, ExtendedApiResponse } from '../../lib/types/index.js';
import { apiGet } from '../../lib/utils/api.js';
import { GetMarketOrderbookSchema } from '../../schemas/index.js';
import { toolResult } from '@kasarlabs/ask-starknet-core';

export interface OrderbookLevel {
  qty: string;
  price: string;
}

export interface OrderbookData {
  market: string;
  bid: OrderbookLevel[];
  ask: OrderbookLevel[];
}

export const getMarketOrderbook = async (
  env: ExtendedApiEnv,
  params: GetMarketOrderbookSchema
): Promise<ExtendedApiResponse<OrderbookData>> => {
  try {
    const data = await apiGet<OrderbookData>(
      env,
      `/api/v1/info/markets/${params.market}/orderbook`,
      false // Public endpoint, no auth required
    );

    return {
      status: 'success',
      data,
    };
  } catch (error: any) {
    console.error('Error getting market orderbook:', error);
    return {
      status: 'failure',
      error: error.message || 'Failed to get market orderbook',
    };
  }
};
