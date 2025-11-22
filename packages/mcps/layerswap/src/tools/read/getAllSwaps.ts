import { toolResult } from '@kasarlabs/ask-starknet-core';
import { LayerswapApiClient } from '../../lib/utils/apiClient.js';
import { GetAllSwapsSchemaType } from '../../schemas/index.js';

export const getAllSwaps = async (
  apiClient: LayerswapApiClient,
  params: GetAllSwapsSchemaType
): Promise<toolResult> => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('address', params.address);
    if (params.page) {
      queryParams.append('page', params.page.toString());
    }
    if (params.include_expired !== undefined) {
      queryParams.append('include_expired', params.include_expired.toString());
    }
    const queryString = queryParams.toString();
    const endpoint = `/api/v2/swaps?${queryString}`;
    const swaps: any = await apiClient.get<any>(endpoint);
    return {
      status: 'success',
      data: swaps as any,
    } as toolResult;
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
