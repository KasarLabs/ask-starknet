import { toolResult } from '@kasarlabs/ask-starknet-core';
import { LayerswapApiClient } from '../../lib/utils/apiClient.js';
import { CreateSwapSchemaType } from '../../schemas/index.js';

export const createSwap = async (
  apiClient: LayerswapApiClient,
  params: CreateSwapSchemaType
): Promise<toolResult> => {
  try {
    const body: any = {
      source: params.source,
      destination: params.destination,
      source_asset: params.source_asset,
      amount: params.amount,
      destination_address: params.destination_address,
    };
    if (params.destination_asset) {
      body.destination_asset = params.destination_asset;
    }
    if (params.refuel !== undefined) {
      body.refuel = params.refuel;
    }
    if (params.source_address) {
      body.source_address = params.source_address;
    }
    const swap: any = await apiClient.post<any>('/api/v2/swaps', body);
    return {
      status: 'success',
      data: swap as any,
    } as toolResult;
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
