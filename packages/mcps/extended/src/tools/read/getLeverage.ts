import {
  ExtendedApiEnv,
  ExtendedApiResponse,
  LeverageSetting,
} from '../../lib/types/index.js';
import { apiGet } from '../../lib/utils/api.js';
import { GetLeverageSchema } from '../../schemas/index.js';
import { toolResult } from '@kasarlabs/ask-starknet-core';

export const getLeverage = async (
  env: ExtendedApiEnv,
  params: GetLeverageSchema
): Promise<ExtendedApiResponse<LeverageSetting[]>> => {
  try {
    const queryParams = new URLSearchParams();
    if (params.market) queryParams.append('market', params.market);

    const endpoint = `/api/v1/user/leverage${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const data = await apiGet<LeverageSetting[]>(env, endpoint, true);

    return {
      status: 'success',
      data,
    };
  } catch (error: any) {
    console.error('Error getting leverage:', error);
    return {
      status: 'failure',
      error: error.message || 'Failed to get leverage settings',
    };
  }
};
