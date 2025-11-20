import { ExtendedApiEnv, ExtendedApiResponse } from '../../lib/types/index.js';
import { apiDelete } from '../../lib/utils/api.js';
import { CancelOrderSchema } from '../../schemas/index.js';
import { toolResult } from '@kasarlabs/ask-starknet-core';

interface CancelOrderResponse {
  success: boolean;
  message: string;
}

export const cancelOrder = async (
  env: ExtendedApiEnv,
  params: CancelOrderSchema
): Promise<toolResult> => {
  try {
    if (!env.privateKey) {
      throw new Error('EXTENDED_PRIVATE_KEY is required for order creation');
    }
    const response = await apiDelete<CancelOrderResponse>(
      env,
      `/api/v1/user/order/${params.order_id}`
    );

    return {
      status: 'success',
      data: response,
    };
  } catch (error: any) {
    console.error('Error canceling order:', error);
    return {
      status: 'failure',
      error: error.message || 'Failed to cancel order',
    };
  }
};
