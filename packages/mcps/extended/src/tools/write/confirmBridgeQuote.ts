import { ExtendedApiEnv, ExtendedApiResponse } from '../../lib/types/index.js';
import { apiPost } from '../../lib/utils/api.js';
import { ConfirmBridgeQuoteSchema } from '../../schemas/index.js';

/**
 * Confirm a bridge quote for EVM deposit/withdrawal
 * This tells the bridge provider (Rhino.fi) to start watching for the transaction
 * @param env - Extended API environment configuration
 * @param params - Quote confirmation parameters
 * @returns Response confirming the quote commitment
 */
export const confirmBridgeQuote = async (
  env: ExtendedApiEnv,
  params: ConfirmBridgeQuoteSchema
): Promise<ExtendedApiResponse<{ success: boolean }>> => {
  try {
    const queryParams = new URLSearchParams({
      id: params.quote_id,
    });

    await apiPost(
      env,
      `/api/v1/user/bridge/quote?${queryParams.toString()}`,
      {}
    );

    return {
      status: 'success',
      data: {
        success: true,
      },
    };
  } catch (error: any) {
    console.error('Error confirming bridge quote:', error);
    return {
      status: 'failure',
      error: error.message || 'Failed to confirm bridge quote',
    };
  }
};
