import { toolResult } from '@kasarlabs/ask-starknet-core';
import { LayerswapApiClient } from '../../lib/utils/apiClient.js';
import { GetQuoteSchemaType } from '../../schemas/index.js';

export const getQuote = async (
  apiClient: LayerswapApiClient,
  params: GetQuoteSchemaType
): Promise<toolResult> => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('source_network', params.source_network);
    queryParams.append('source_token', params.source_token);
    queryParams.append('destination_network', params.destination_network);
    queryParams.append('destination_token', params.destination_token);
    queryParams.append('amount', params.amount.toString());
    if (params.source_address) {
      queryParams.append('source_address', params.source_address);
    }
    if (params.slippage) {
      queryParams.append('slippage', params.slippage);
    }
    if (params.use_deposit_address !== undefined) {
      queryParams.append(
        'use_deposit_address',
        params.use_deposit_address.toString()
      );
    }
    if (params.refuel !== undefined) {
      queryParams.append('refuel', params.refuel.toString());
    }
    const endpoint = `/api/v2/quote?${queryParams.toString()}`;
    console.error('endpoint', endpoint);
    const quote: any = await apiClient.get<any>(endpoint);
    return {
      status: 'success',
      data: quote as any,
    } as toolResult;
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
