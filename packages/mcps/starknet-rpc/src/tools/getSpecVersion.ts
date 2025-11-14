import { RpcProvider } from 'starknet';
import { toolResult } from '@kasarlabs/ask-starknet-core';

export const getSpecVersion = async (provider: RpcProvider): Promise<toolResult> => {
  try {
    const specVersion = await provider.getSpecVersion();

    return {
      status: 'success',
      data: { specVersion, },
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
