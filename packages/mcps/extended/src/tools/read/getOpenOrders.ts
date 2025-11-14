import {
  ExtendedApiEnv,
  ExtendedApiResponse,
  OrderReturn,
} from '../../lib/types/index.js';
import { apiGet } from '../../lib/utils/api.js';
import { GetOpenOrdersSchema } from '../../schemas/index.js';
import { toolResult } from '@kasarlabs/ask-starknet-core';

export const getOpenOrders = async (
  env: ExtendedApiEnv,
  params: GetOpenOrdersSchema
): Promise<ExtendedApiResponse<OrderReturn[]>> => {
  try {
    const queryParams = new URLSearchParams();
    if (params.market) queryParams.append('market', params.market);
    if (params.type) queryParams.append('type', params.type);
    if (params.side) queryParams.append('side', params.side);

    const endpoint = `/api/v1/user/orders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const data = await apiGet<OrderReturn[]>(env, endpoint, true);

    return {
      status: 'success',
      data,
    };
  } catch (error: any) {
    console.error('Error getting open orders:', error);
    return {
      status: 'failure',
      error: error.message || 'Failed to get open orders',
    };
  }
};
