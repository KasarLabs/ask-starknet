import { ExtendedApiEnv, ExtendedApiResponse } from '../../lib/types/index.js';
import { apiGet } from '../../lib/utils/api.js';
import { GetFundingRatesHistorySchema } from '../../schemas/index.js';
import { toolResult } from '@kasarlabs/ask-starknet-core';

export interface FundingRate {
  m: string;
  T: number;
  f: string;
}

export interface FundingRatesPagination {
  cursor?: number;
  count: number;
}

export interface FundingRatesResponse {
  data: FundingRate[];
  pagination?: FundingRatesPagination;
}

export const getFundingRatesHistory = async (
  env: ExtendedApiEnv,
  params: GetFundingRatesHistorySchema
): Promise<ExtendedApiResponse<FundingRatesResponse>> => {
  try {
    // Build query parameters
    const queryParams = new URLSearchParams({
      startTime: params.startTime.toString(),
      endTime: params.endTime.toString(),
    });

    if (params.cursor) {
      queryParams.append('cursor', params.cursor.toString());
    }

    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    }

    const response = await apiGet<FundingRatesResponse>(
      env,
      `/api/v1/info/${params.market}/funding?${queryParams.toString()}`,
      false // Public endpoint, no auth required
    );

    return {
      status: 'success',
      data: response,
    };
  } catch (error: any) {
    console.error('Error getting funding rates:', error);
    return {
      status: 'failure',
      error: error.message || 'Failed to get funding rates',
    };
  }
};
