import { toolResult } from '@kasarlabs/ask-starknet-core';
import { LayerswapApiClient } from '../../lib/utils/apiClient.js';
import { GetDepositActionsSchemaType } from '../../schemas/index.js';

export const getDepositActions = async (
  apiClient: LayerswapApiClient,
  params: GetDepositActionsSchemaType
): Promise<toolResult> => {
  try {
    const endpoint = `/api/v2/swaps/${params.swap_id}/deposit_actions`;
    const depositActions: any = await apiClient.get<any>(endpoint);
    return {
      status: 'success',
      data: depositActions as any,
    } as toolResult;
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

