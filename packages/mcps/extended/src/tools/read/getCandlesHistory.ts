import { ExtendedApiEnv, ExtendedApiResponse } from '../../lib/types/index.js';
import { apiGet } from '../../lib/utils/api.js';
import { GetCandlesHistorySchema } from '../../schemas/index.js';

export interface Candle {
  o: string;
  l: string;
  h: string;
  c: string;
  v?: string;
  T: number;
}

export const getCandlesHistory = async (
  env: ExtendedApiEnv,
  params: GetCandlesHistorySchema
): Promise<ExtendedApiResponse<Candle[]>> => {
  try {
    // Build query parameters
    const queryParams = new URLSearchParams({
      interval: params.interval,
      limit: params.limit.toString(),
    });

    if (params.endTime) {
      queryParams.append('endTime', params.endTime.toString());
    }

    const data = await apiGet<Candle[]>(
      env,
      `/api/v1/info/candles/${params.market}/${params.candleType}?${queryParams.toString()}`,
      false // Public endpoint, no auth required
    );

    return {
      status: 'success',
      data,
    };
  } catch (error: any) {
    console.error('Error getting candles:', error);
    return {
      status: 'failure',
      error: error.message || 'Failed to get candles',
    };
  }
};
