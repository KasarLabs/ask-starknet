import { RpcProvider } from 'starknet';
import { toolResult } from '@kasarlabs/ask-starknet-core';

export const getBlockTransactionsTraces = async (
  provider: RpcProvider,
  params: { blockId: string }
): Promise<toolResult> => {
  try {
    const blockTransactionsTraces = await provider.getBlockTransactionsTraces(
      params.blockId
    );

    return {
      status: 'success',
      data: { blockTransactionsTraces: blockTransactionsTraces as any },
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
