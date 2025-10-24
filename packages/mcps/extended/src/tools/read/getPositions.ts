import {
  ExtendedApiEnv,
  ExtendedApiResponse,
  Position,
} from '../../lib/types/index.js';
import { apiGet } from '../../lib/utils/api.js';
import { GetPositionsSchema } from '../../schemas/index.js';

export const getPositions = async (
  env: ExtendedApiEnv,
  params: GetPositionsSchema
): Promise<ExtendedApiResponse<Position[]>> => {
  try {
    const queryParams = new URLSearchParams();
    if (params.market) queryParams.append('market', params.market);
    if (params.side) queryParams.append('side', params.side);

    const endpoint = `/api/v1/user/positions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const data = await apiGet<Position[]>(env, endpoint, true);

    return {
      status: 'success',
      data,
    };
  } catch (error: any) {
    console.error('Error getting positions:', error);
    return {
      status: 'failure',
      error: error.message || 'Failed to get positions',
    };
  }
};
