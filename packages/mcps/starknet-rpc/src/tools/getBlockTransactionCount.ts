import { RpcProvider } from 'starknet';
import { blockIdSchema } from '../schemas/index.js';
import { z } from 'zod';

export const getBlockTransactionCount = async (
  provider: RpcProvider,
  params: z.infer<typeof blockIdSchema>
) => {
  try {
    const blockTransactionCount = await provider.getBlockTransactionCount(
      params.blockId
    );

    return {
      status: 'success',
      blockTransactionCount,
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
