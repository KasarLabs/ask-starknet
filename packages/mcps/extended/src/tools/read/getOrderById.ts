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
    // Ensure order_id is treated as a string to preserve precision for large numbers
    const response = await apiGet<OrderReturn>(
      env,
      `/api/v1/user/orders/${params.order_id}`,
      true
    );

    return {
      status: 'success',
      data: response,
    };
  } catch (error: any) {
    console.error('Error getting order by ID:', error);
    return {
      status: 'failure',
      error: error.message || 'Failed to get order',
    };
  }
};
