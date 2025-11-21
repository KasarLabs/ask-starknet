import { toolResult } from '@kasarlabs/ask-starknet-core';
import { LayerswapApiClient } from '../../lib/utils/apiClient.js';
import { GetDestinationsSchemaType } from '../../schemas/index.js';

export const getDestinations = async (
  apiClient: LayerswapApiClient,
  params: GetDestinationsSchemaType
): Promise<toolResult> => {
  try {
    const queryParams = new URLSearchParams();
    if (params.source) {
      queryParams.append('source', params.source);
    }
    if (params.asset) {
      queryParams.append('asset', params.asset);
    }
    const queryString = queryParams.toString();
    const endpoint = `/api/v2/destinations${queryString ? `?${queryString}` : ''}`;
    const destinations: any = await apiClient.get<any>(endpoint);
    return {
      status: 'success',
      data: destinations as any,
    } as toolResult;
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
