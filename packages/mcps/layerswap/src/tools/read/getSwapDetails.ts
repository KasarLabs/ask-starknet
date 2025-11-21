import { toolResult } from '@kasarlabs/ask-starknet-core';
import { LayerswapApiClient } from '../../lib/utils/apiClient.js';
import { GetSwapDetailsSchemaType } from '../../schemas/index.js';

export const getSwapDetails = async (
  apiClient: LayerswapApiClient,
  params: GetSwapDetailsSchemaType
): Promise<toolResult> => {
  try {
    const endpoint = `/api/v2/swaps/${params.swap_id}`;
    const swapDetails: any = await apiClient.get<any>(endpoint);
    return {
      status: 'success',
      data: swapDetails as any,
    } as toolResult;
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
