import { toolResult } from '@kasarlabs/ask-starknet-core';
import { LayerswapApiClient } from '../../lib/utils/apiClient.js';
import { GetNetworksSchemaType } from '../../schemas/index.js';

export const getNetworks = async (
  apiClient: LayerswapApiClient,
  params?: GetNetworksSchemaType
): Promise<toolResult> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.network_types && params.network_types.length > 0) {
      params.network_types.forEach((type) => {
        queryParams.append('network_types', type);
      });
    }
    const endpoint = `/api/v2/networks${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const result: any = await apiClient.get<any>(endpoint);
    return {
      status: 'success',
      data: result as any,
    } as toolResult;
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
