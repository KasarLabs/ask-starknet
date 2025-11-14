import { RpcProvider } from 'starknet';
import { toolResult } from '@kasarlabs/ask-starknet-core';

export const getChainId = async (
  provider: RpcProvider
): Promise<toolResult> => {
  try {
    const chainId = await provider.getChainId();

    return {
      status: 'success',
      data: { chainId },
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
