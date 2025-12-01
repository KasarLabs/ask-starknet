import { toolResult } from '@kasarlabs/ask-starknet-core';
import { LayerswapApiClient } from '../../lib/utils/apiClient.js';
import { GetTransactionStatusSchemaType } from '../../schemas/index.js';

export const getTransactionStatus = async (
  apiClient: LayerswapApiClient,
  params: GetTransactionStatusSchemaType
): Promise<toolResult> => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('network', params.network.toUpperCase());
    queryParams.append('transaction_id', params.transaction_id);
    const endpoint = `/api/v2/transaction_status?${queryParams.toString()}`;
    const status: any = await apiClient.get<any>(endpoint);
    return {
      status: 'success',
      data: status,
    } as toolResult;
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
