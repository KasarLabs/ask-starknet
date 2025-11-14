import { RpcProvider } from 'starknet';
import { toolResult } from '@kasarlabs/ask-starknet-core';

export const getNonceForAddress = async (
  provider: RpcProvider,
  params: { contractAddress: string; blockId?: string }
): Promise<toolResult> => {
  try {
    const nonce = await provider.getNonceForAddress(
      params.contractAddress,
      params.blockId
    );

    return {
      status: 'success',
      data: { nonce },
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
