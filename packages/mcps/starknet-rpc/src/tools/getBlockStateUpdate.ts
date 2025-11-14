import { RpcProvider } from 'starknet';
import { toolResult } from '@kasarlabs/ask-starknet-core';

export const getBlockStateUpdate = async (
  provider: RpcProvider,
  params: { blockId: string }
): Promise<toolResult> => {
  try {
    const blockStateUpdate = await provider.getStateUpdate(params.blockId);

    return {
      status: 'success',
      data: { blockStateUpdate },
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
