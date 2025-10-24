import {
  ExtendedApiEnv,
  ExtendedApiResponse,
  OrderReturn,
} from '../../lib/types/index.js';
import { apiGet } from '../../lib/utils/api.js';
import { GetOrderByIdSchema } from '../../schemas/index.js';

export const getOrderById = async (
  env: ExtendedApiEnv,
  params: GetOrderByIdSchema
): Promise<ExtendedApiResponse<OrderReturn>> => {
  try {
    const data = await apiGet<OrderReturn>(
      env,
      `/api/v1/user/orders/${params.order_id}`,
      true
    );

    return {
      status: 'success',
      data,
    };
  } catch (error: any) {
    console.error('Error getting order by ID:', error);
    return {
      status: 'failure',
      error: error.message || 'Failed to get order',
    };
  }
};
