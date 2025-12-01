import { toolResult } from '@kasarlabs/ask-starknet-core';
import { LayerswapApiClient } from '../../lib/utils/apiClient.js';
import { GetDetailedQuoteSchemaType } from '../../schemas/index.js';

export const getDetailedQuote = async (
  apiClient: LayerswapApiClient,
  params: GetDetailedQuoteSchemaType
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
    queryParams.append(
      'use_deposit_address',
      (params.use_deposit_address ?? false).toString()
    );
    if (params.refuel !== undefined) {
      queryParams.append('refuel', params.refuel.toString());
    }
    if (params.source_address) {
      queryParams.append('source_address', params.source_address);
    }
    if (params.slippage) {
      const slippageDecimal = (parseFloat(params.slippage) / 100).toString();
      queryParams.append('slippage', slippageDecimal);
    }
    const endpoint = `/api/v2/detailed_quote?${queryParams.toString()}`;
    const quote: any = await apiClient.get<any>(endpoint);
    return {
      status: 'success',
      data: quote,
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
