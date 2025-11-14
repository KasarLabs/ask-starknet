import {
  ExtendedApiEnv,
  ExtendedApiResponse,
  FeeSchedule,
} from '../../lib/types/index.js';
import { apiGet } from '../../lib/utils/api.js';
import { GetFeesSchema } from '../../schemas/index.js';
import { toolResult } from '@kasarlabs/ask-starknet-core';

export const getFees = async (
  env: ExtendedApiEnv,
  params: GetFeesSchema
): Promise<ExtendedApiResponse<FeeSchedule>> => {
  try {
    const queryParams = new URLSearchParams();
    if (params.market) queryParams.append('market', params.market);

    const endpoint = `/api/v1/user/fees${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const response = await apiGet<FeeSchedule>(env, endpoint, true);

    return {
      status: 'success',
      data: response,
    };
  } catch (error: any) {
    console.error('Error getting fees:', error);
    return {
      status: 'failure',
      error: error.message || 'Failed to get fee schedule',
    };
  }
};
