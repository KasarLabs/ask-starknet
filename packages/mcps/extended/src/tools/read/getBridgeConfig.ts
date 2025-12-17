import { ExtendedApiEnv, ExtendedApiResponse } from '../../lib/types/index.js';
import { apiGet } from '../../lib/utils/api.js';

interface BridgeChain {
  chain: string;
  contractAddress: string;
}

interface BridgeConfigResponse {
  chains: BridgeChain[];
}

/**
 * Get supported EVM chains and bridge contract addresses
 * @param env - Extended API environment configuration
 * @returns Response with bridge configuration
 */
export const getBridgeConfig = async (
  env: ExtendedApiEnv
): Promise<ExtendedApiResponse<BridgeConfigResponse>> => {
  try {
    const response = await apiGet<{
      status: string;
      data: any;
    }>(env, '/api/v1/user/bridge/config', true);

    return {
      status: 'success',
      data: {
        chains: response.data,
      },
    };
  } catch (error: any) {
    console.error('Error getting bridge config:', error);
    return {
      status: 'failure',
      error: error.message || 'Failed to get bridge configuration',
    };
  }
};
