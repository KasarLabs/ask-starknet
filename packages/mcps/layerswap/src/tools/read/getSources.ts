import { toolResult } from '@kasarlabs/ask-starknet-core';
import { LayerswapApiClient } from '../../lib/utils/apiClient.js';
import { GetSourcesSchemaType } from '../../schemas/index.js';

export const getSources = async (
  apiClient: LayerswapApiClient,
  params?: GetSourcesSchemaType
): Promise<toolResult> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.destination_network) {
      queryParams.append(
        'destination_network',
        params.destination_network.toUpperCase()
      );
    }
    if (params?.destination_token) {
      queryParams.append(
        'destination_token',
        params.destination_token.toUpperCase()
      );
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
    if (params?.has_deposit_address !== undefined) {
      queryParams.append(
        'has_deposit_address',
        params.has_deposit_address.toString()
      );
    }
    if (params?.network_types && params.network_types.length > 0) {
      params.network_types.forEach((type) => {
        queryParams.append('network_types', type);
      });
    }
    const queryString = queryParams.toString();
    const endpoint = `/api/v2/sources${queryString ? `?${queryString}` : ''}`;
    const sources: any = await apiClient.get<any>(endpoint);
    return {
      status: 'success',
      data: sources,
    } as toolResult;
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
