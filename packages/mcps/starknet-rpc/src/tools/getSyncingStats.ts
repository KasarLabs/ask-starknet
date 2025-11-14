import { RpcProvider } from 'starknet';
import { toolResult } from '@kasarlabs/ask-starknet-core';

export const getSyncingStats = async (
  provider: RpcProvider
): Promise<toolResult> => {
  try {
    const syncingStats = await provider.getSyncingStats();

    return {
      status: 'success',
      data: { syncingStats: syncingStats as any },
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
