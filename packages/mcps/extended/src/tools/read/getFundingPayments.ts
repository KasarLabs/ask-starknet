import { ExtendedApiEnv, ExtendedApiResponse } from '../../lib/types/index.js';
import { apiGet } from '../../lib/utils/api.js';
import { GetFundingPaymentsSchema } from '../../schemas/index.js';

interface FundingPayment {
  accountId: number;
  fundingFee: string;
  fundingRate: string;
  id: number;
  markPrice: string;
  market: string;
  paidTime: number;
  positionId: number;
  side: string;
  size: string;
  value: string;
}

export const getFundingPayments = async (
  env: ExtendedApiEnv,
  params: GetFundingPaymentsSchema
): Promise<ExtendedApiResponse<FundingPayment[]>> => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('fromTime', params.fromTime.toString());
    if (params.market) queryParams.append('market', params.market);
    if (params.side) queryParams.append('side', params.side);

    const endpoint = `/api/v1/user/funding/history?${queryParams.toString()}`;

    const response = await apiGet<FundingPayment[]>(env, endpoint, true);

    return {
      status: 'success',
      data: response,
    };
  } catch (error: any) {
    console.error('Error getting funding payments:', error);
    return {
      status: 'failure',
      error: error.message || 'Failed to get funding payments',
    };
  }
};
