import { toolResult } from '@kasarlabs/ask-starknet-core';
import { LayerswapApiClient } from '../../lib/utils/apiClient.js';
import { GetTransactionStatusSchemaType } from '../../schemas/index.js';

export const getTransactionStatus = async (
  apiClient: LayerswapApiClient,
  params: GetTransactionStatusSchemaType
): Promise<toolResult> => {
  try {
    const endpoint = `/api/v2/swaps/${params.swap_id}/status`;
    const status: any = await apiClient.get<any>(endpoint);
    return {
      status: 'success',
      data: status as any,
    } as toolResult;
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
