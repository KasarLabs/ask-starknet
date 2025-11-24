import { toolResult } from '@kasarlabs/ask-starknet-core';
import { LayerswapApiClient } from '../../lib/utils/apiClient.js';
import { GetSwapDetailsSchemaType } from '../../schemas/index.js';

export const getSwapDetails = async (
  apiClient: LayerswapApiClient,
  params: GetSwapDetailsSchemaType
): Promise<toolResult> => {
  try {
    const queryParams = new URLSearchParams();
    if (params.exclude_deposit_actions !== undefined) {
      queryParams.append(
        'exclude_deposit_actions',
        params.exclude_deposit_actions.toString()
      );
    }
    if (params.source_address) {
      queryParams.append('source_address', params.source_address);
    }
    const queryString = queryParams.toString();
    const endpoint = `/api/v2/swaps/${params.swap_id}${
      queryString ? `?${queryString}` : ''
    }`;
    const swapDetails: any = await apiClient.get<any>(endpoint);
    return {
      status: 'success',
      data: swapDetails,
    } as toolResult;
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
