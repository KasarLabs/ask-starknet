import { toolResult } from '@kasarlabs/ask-starknet-core';
import { LayerswapApiClient } from '../../lib/utils/apiClient.js';
import { GetSourcesSchemaType } from '../../schemas/index.js';

export const getSources = async (
  apiClient: LayerswapApiClient,
  params: GetSourcesSchemaType
): Promise<toolResult> => {
  try {
    const queryParams = new URLSearchParams();
    if (params.destination) {
      queryParams.append('destination', params.destination);
    }
    if (params.asset) {
      queryParams.append('asset', params.asset);
    }
    const queryString = queryParams.toString();
    const endpoint = `/api/v2/sources${queryString ? `?${queryString}` : ''}`;
    const sources: any = await apiClient.get<any>(endpoint);
    return {
      status: 'success',
      data: sources as any,
    } as toolResult;
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
