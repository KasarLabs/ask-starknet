import { ExtendedApiEnv, ExtendedApiResponse } from '../../lib/types/index.js';
import { apiGet } from '../../lib/utils/api.js';
import { GetBridgeQuoteSchema } from '../../schemas/index.js';

interface BridgeQuote {
  id: string;
  fee: string;
}

/**
 * Get a quote for EVM deposit/withdrawal bridge transaction
 * @param env - Extended API environment configuration
 * @param params - Bridge quote parameters
 * @returns Response with quote ID and fee
 */
export const getBridgeQuote = async (
  env: ExtendedApiEnv,
  params: GetBridgeQuoteSchema
): Promise<ExtendedApiResponse<BridgeQuote>> => {
  try {
    const queryParams = new URLSearchParams({
      chainIn: params.chain_in,
      chainOut: params.chain_out,
      amount: params.amount.toString(),
    });

    const response = await apiGet<{ status: string; data: BridgeQuote }>(
      env,
      `/api/v1/user/bridge/quote?${queryParams.toString()}`,
      true
    );

    return {
      status: 'success',
      data: response.data,
    };
  } catch (error: any) {
    console.error('Error getting bridge quote:', error);
    return {
      status: 'failure',
      error: error.message || 'Failed to get bridge quote',
    };
  }
};
