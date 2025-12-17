import { toolResult } from '@kasarlabs/ask-starknet-core';
import { LayerswapApiClient } from '../../lib/utils/apiClient.js';
import { GetDepositActionsSchemaType } from '../../schemas/index.js';

export const getDepositActions = async (
  apiClient: LayerswapApiClient,
  params: GetDepositActionsSchemaType
): Promise<toolResult> => {
  try {
    const queryParams = new URLSearchParams();
    if (params.source_address) {
      queryParams.append('source_address', params.source_address);
    }
    const queryString = queryParams.toString();
    const endpoint = `/api/v2/swaps/${params.swap_id}/deposit_actions${
      queryString ? `?${queryString}` : ''
    }`;
    const response: any = await apiClient.get<any>(endpoint);
    // Extract the inner data property to avoid double nesting
    const data = response?.data !== undefined ? response.data : response;
    return {
      status: 'success',
      data: data,
    } as toolResult;
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
