import { ExtendedApiEnv, ExtendedApiResponse } from '../../lib/types/index.js';
import { apiGet } from '../../lib/utils/api.js';
import { GetOpenInterestsHistorySchema } from '../../schemas/index.js';

export interface OpenInterest {
  i: string;
  I: string;
  t: number;
}

export const getOpenInterestsHistory = async (
  env: ExtendedApiEnv,
  params: GetOpenInterestsHistorySchema
): Promise<ExtendedApiResponse<OpenInterest[]>> => {
  try {
    // Build query parameters
    const queryParams = new URLSearchParams({
      interval: params.interval,
      startTime: params.startTime.toString(),
      endTime: params.endTime.toString(),
    });

    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    }

    const endpoint = `/api/v1/info/${params.market}/open-interests?${queryParams.toString()}`;
    console.error('Calling open interests endpoint:', endpoint);

    const response = await apiGet<OpenInterest[]>(
      env,
      endpoint,
      false // Public endpoint, no auth required
    );

    return {
      status: 'success',
      data: response,
    };
  } catch (error: any) {
    console.error('Error getting open interests:', error);
    return {
      status: 'failure',
      error: error.message || 'Failed to get open interests',
    };
  }
};
