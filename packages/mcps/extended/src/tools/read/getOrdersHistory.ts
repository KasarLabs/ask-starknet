import {
  ExtendedApiEnv,
  ExtendedApiResponse,
  OrderReturn,
} from '../../lib/types/index.js';
import { apiGet } from '../../lib/utils/api.js';
import { GetOrdersHistorySchema } from '../../schemas/index.js';

export const getOrdersHistory = async (
  env: ExtendedApiEnv,
  params: GetOrdersHistorySchema
): Promise<ExtendedApiResponse<OrderReturn[]>> => {
  try {
    const queryParams = new URLSearchParams();
    if (params.market_id) queryParams.append('market_id', params.market_id);
    if (params.start_time)
      queryParams.append('start_time', params.start_time.toString());
    if (params.end_time)
      queryParams.append('end_time', params.end_time.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const endpoint = `/api/v1/user/orders/history${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const response = await apiGet<OrderReturn[]>(env, endpoint, true);

    return {
      status: 'success',
      data: response,
    };
  } catch (error: any) {
    console.error('Error getting orders history:', error);
    return {
      status: 'failure',
      error: error.message || 'Failed to get orders history',
    };
  }
};
