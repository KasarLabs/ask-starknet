import { ExtendedApiEnv, ExtendedApiResponse } from '../../lib/types/index.js';
import { apiGet } from '../../lib/utils/api.js';
import { GetMarketTradesSchema } from '../../schemas/index.js';

export interface MarketTrade {
  i: number;
  m: string;
  S: 'BUY' | 'SELL';
  tT: 'TRADE' | 'LIQUIDATION' | 'DELEVERAGE';
  T: number;
  p: string;
  q: string;
}

export const getMarketTrades = async (
  env: ExtendedApiEnv,
  params: GetMarketTradesSchema
): Promise<ExtendedApiResponse<MarketTrade[]>> => {
  try {
    const data = await apiGet<MarketTrade[]>(
      env,
      `/api/v1/info/markets/${params.market}/trades`,
      false // Public endpoint, no auth required
    );

    return {
      status: 'success',
      data,
    };
  } catch (error: any) {
    console.error('Error getting market trades:', error);
    return {
      status: 'failure',
      error: error.message || 'Failed to get market trades',
    };
  }
};
