import {
  ExtendedApiEnv,
  ExtendedApiResponse,
  Trade,
} from '../../lib/types/index.js';
import { apiGet } from '../../lib/utils/api.js';
import { GetTradesHistorySchema } from '../../schemas/index.js';

export const getTradesHistory = async (
  env: ExtendedApiEnv,
  params: GetTradesHistorySchema
): Promise<ExtendedApiResponse<Trade[]>> => {
  try {
    const queryParams = new URLSearchParams();
    if (params.market_id) queryParams.append('market_id', params.market_id);
    if (params.start_time)
      queryParams.append('start_time', params.start_time.toString());
    if (params.end_time)
      queryParams.append('end_time', params.end_time.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const endpoint = `/api/v1/user/trades${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const response = await apiGet<Trade[]>(env, endpoint, true);

    return {
      status: 'success',
      data: response,
    };
  } catch (error: any) {
    console.error('Error getting trades history:', error);
    return {
      status: 'failure',
      error: error.message || 'Failed to get trades history',
    };
  }
};
