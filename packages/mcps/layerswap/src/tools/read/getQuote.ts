import { toolResult } from '@kasarlabs/ask-starknet-core';
import { LayerswapApiClient } from '../../lib/utils/apiClient.js';
import { GetQuoteSchemaType } from '../../schemas/index.js';

export const getQuote = async (
  apiClient: LayerswapApiClient,
  params: GetQuoteSchemaType
): Promise<toolResult> => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('source_network', params.source_network.toUpperCase());
    queryParams.append('source_token', params.source_token.toUpperCase());
    queryParams.append(
      'destination_network',
      params.destination_network.toUpperCase()
    );
    queryParams.append(
      'destination_token',
      params.destination_token.toUpperCase()
    );
    queryParams.append('amount', params.amount.toString());
    if (params.source_address) {
      queryParams.append('source_address', params.source_address);
    }
    if (params.slippage) {
      // Convert from percentage (10 = 10%) to decimal (0.1 = 10%) for API
      const slippageDecimal = (parseFloat(params.slippage) / 100).toString();
      queryParams.append('slippage', slippageDecimal);
    }
    queryParams.append(
      'use_deposit_address',
      (params.use_deposit_address ?? false).toString()
    );
    if (params.refuel !== undefined) {
      queryParams.append('refuel', params.refuel.toString());
    }
    const endpoint = `/api/v2/quote?${queryParams.toString()}`;
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
