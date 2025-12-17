import { ExtendedApiEnv, ExtendedApiResponse } from '../../lib/types/index.js';
import { apiPatch } from '../../lib/utils/api.js';
import { UpdateLeverageSchema } from '../../schemas/index.js';
import { toolResult } from '@kasarlabs/ask-starknet-core';

interface UpdateLeverageResponse {
  success: boolean;
  message: string;
}

export const updateLeverage = async (
  env: ExtendedApiEnv,
  params: UpdateLeverageSchema
): Promise<toolResult> => {
  try {
    if (!env.privateKey) {
      throw new Error('EXTENDED_PRIVATE_KEY is required for order creation');
    }
    const payload = {
      market: params.market_id,
      leverage: params.leverage,
    };
    const response = await apiPatch<UpdateLeverageResponse>(
      env,
      '/api/v1/user/leverage',
      payload
    );

    return {
      status: 'success',
      data: response,
    };
  } catch (error: any) {
    return {
      status: 'failure',
      error: error.message || 'Failed to update leverage',
    };
  }
};
