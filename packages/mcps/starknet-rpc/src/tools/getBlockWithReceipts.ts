import { RpcProvider } from 'starknet';
import { blockIdSchema } from '../schemas/index.js';
import { z } from 'zod';

export const getBlockWithReceipts = async (
  provider: RpcProvider,
  params: z.infer<typeof blockIdSchema>
) => {
  try {
    const blockWithReceipts = await provider.getBlockWithReceipts(
      params.blockId
    );

    return {
      status: 'success',
      blockWithReceipts: blockWithReceipts as any,
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
