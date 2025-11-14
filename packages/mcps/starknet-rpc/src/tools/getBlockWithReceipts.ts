import { RpcProvider } from 'starknet';
import { blockIdSchema } from '../schemas/index.js';
import { z } from 'zod';
import { toolResult } from '@kasarlabs/ask-starknet-core';

export const getBlockWithReceipts = async (
  provider: RpcProvider,
  params: z.infer<typeof blockIdSchema>
): Promise<toolResult> => {
  try {
    const blockWithReceipts = await provider.getBlockWithReceipts(
      params.blockId
    );

    return {
      status: 'success',
      data: { blockWithReceipts: blockWithReceipts as any, },
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
