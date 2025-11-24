import { toolResult } from '@kasarlabs/ask-starknet-core';
import { LayerswapApiClient } from '../../lib/utils/apiClient.js';
import { GetDestinationsSchemaType } from '../../schemas/index.js';

export const getDestinations = async (
  apiClient: LayerswapApiClient,
  params?: GetDestinationsSchemaType
): Promise<toolResult> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.source_network) {
      queryParams.append('source_network', params.source_network.toUpperCase());
    }
    if (params?.source_token) {
      queryParams.append('source_token', params.source_token.toUpperCase());
    }
    if (params?.include_swaps !== undefined) {
      queryParams.append('include_swaps', params.include_swaps.toString());
    }
    if (params?.include_unavailable !== undefined) {
      queryParams.append(
        'include_unavailable',
        params.include_unavailable.toString()
      );
    }
    if (params?.include_unmatched !== undefined) {
      queryParams.append(
        'include_unmatched',
        params.include_unmatched.toString()
      );
    }
    if (params?.network_types && params.network_types.length > 0) {
      params.network_types.forEach((type) => {
        queryParams.append('network_types', type);
      });
    }
    const queryString = queryParams.toString();
    const endpoint = `/api/v2/destinations${queryString ? `?${queryString}` : ''}`;
    const destinations: any = await apiClient.get<any>(endpoint);
    return {
      status: 'success',
      data: destinations,
    } as toolResult;
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
