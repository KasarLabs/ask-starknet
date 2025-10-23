import { ExtendedApiEnv, ExtendedApiResponse, Position } from '../../lib/types/index.js';
import { apiGet } from '../../lib/utils/api.js';
import { GetPositionsHistorySchema } from '../../schemas/index.js';

export const getPositionsHistory = async (
  env: ExtendedApiEnv,
  params: GetPositionsHistorySchema
): Promise<ExtendedApiResponse<Position[]>> => {
  try {
    const queryParams = new URLSearchParams();
    if (params.market_id) queryParams.append('market_id', params.market_id);
    if (params.side) queryParams.append('side', params.side);
    if (params.start_time) queryParams.append('start_time', params.start_time.toString());
    if (params.end_time) queryParams.append('end_time', params.end_time.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const endpoint = `/api/v1/user/positions/history${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const data = await apiGet<Position[]>(
      env,
      endpoint,
      true
    );

    return {
      status: 'success',
      data,
    };
  } catch (error: any) {
    console.error('Error getting positions history:', error);
    return {
      status: 'failure',
      error: error.message || 'Failed to get positions history',
    };
  }
};
