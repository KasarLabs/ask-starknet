import { RpcProvider } from 'starknet';
import { blockIdSchema } from '../schemas/index.js';
import { z } from 'zod';
import { toolResult } from '@kasarlabs/ask-starknet-core';

export const getBlockTransactionCount = async (
  provider: RpcProvider,
  params: z.infer<typeof blockIdSchema>
): Promise<toolResult> => {
  try {
    const blockTransactionCount = await provider.getBlockTransactionCount(
      params.blockId
    );

    return {
      status: 'success',
      data: { blockTransactionCount },
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
