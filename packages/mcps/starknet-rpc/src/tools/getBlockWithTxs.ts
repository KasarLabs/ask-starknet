import { RpcProvider } from 'starknet';
import { toolResult } from '@kasarlabs/ask-starknet-core';

export const getBlockWithTxs = async (
  provider: RpcProvider,
  params: { blockId: string }
): Promise<toolResult> => {
  try {
    const blockWithTxs = await provider.getBlockWithTxs(params.blockId);

    return {
      status: 'success',
      data: { blockWithTxs: blockWithTxs as any, },
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
