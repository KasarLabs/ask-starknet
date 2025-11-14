import { RpcProvider } from 'starknet';
import { blockIdSchema } from '../schemas/index.js';
import { z } from 'zod';
import { toolResult } from '@kasarlabs/ask-starknet-core';

export const getBlockWithTxHashes = async (
  provider: RpcProvider,
  params: z.infer<typeof blockIdSchema>
): Promise<toolResult> => {
  try {
    const blockWithTxHashes = await provider.getBlockWithTxHashes(
      params.blockId
    );

    return {
      status: 'success',
      data: { blockWithTxHashes: blockWithTxHashes as any },
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
