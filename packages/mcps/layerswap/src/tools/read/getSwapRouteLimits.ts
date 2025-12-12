import { toolResult } from '@kasarlabs/ask-starknet-core';
import { LayerswapApiClient } from '../../lib/utils/apiClient.js';
import { GetSwapRouteLimitsSchemaType } from '../../schemas/index.js';

export const getSwapRouteLimits = async (
  apiClient: LayerswapApiClient,
  params: GetSwapRouteLimitsSchemaType
): Promise<toolResult> => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('source_network', params.source_network.toUpperCase());
    queryParams.append('source_token', params.source_token.toUpperCase());
    queryParams.append(
      'destination_network',
      params.destination_network.toUpperCase()
    );
    queryParams.append(
      'destination_token',
      params.destination_token.toUpperCase()
    );
    queryParams.append(
      'use_deposit_address',
      (params.use_deposit_address ?? false).toString()
    );
    if (params.refuel !== undefined) {
      queryParams.append('refuel', params.refuel.toString());
    }
    const endpoint = `/api/v2/limits?${queryParams.toString()}`;

    const response: any = await apiClient.get<any>(endpoint);
    // Extract the inner data property to avoid double nesting
    const limits = response?.data || response;
    return {
      status: 'success',
      data: limits,
    } as toolResult;
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
