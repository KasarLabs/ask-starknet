import { RpcProvider } from 'starknet';
import { toolResult } from '@kasarlabs/ask-starknet-core';

export const getBlockNumber = async (
  provider: RpcProvider
): Promise<toolResult> => {
  try {
    const blockNumber = await provider.getBlockNumber();

    return {
      status: 'success',
      data: { blockNumber },
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
