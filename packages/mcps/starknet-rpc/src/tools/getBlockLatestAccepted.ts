import { RpcProvider } from 'starknet';
import { toolResult } from '@kasarlabs/ask-starknet-core';

export const getBlockLatestAccepted = async (
  provider: RpcProvider
): Promise<toolResult> => {
  try {
    const blockHashAndNumber = await provider.getBlockLatestAccepted();

    return {
      status: 'success',
      data: { blockHashAndNumber: blockHashAndNumber as any },
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
