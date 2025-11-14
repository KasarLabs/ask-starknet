import { RpcProvider } from 'starknet';
import { toolResult } from '@kasarlabs/ask-starknet-core';

export const getTransactionByBlockIdAndIndex = async (
  provider: RpcProvider,
  params: { blockId: string; index: number }
): Promise<toolResult> => {
  try {
    const transaction = await provider.getTransactionByBlockIdAndIndex(
      params.blockId,
      params.index
    );

    return {
      status: 'success',
      data: { transaction: transaction as any, },
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
