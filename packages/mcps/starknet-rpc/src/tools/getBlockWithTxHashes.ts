import { RpcProvider } from 'starknet';
import { blockIdSchema } from '../schemas/index.js';
import { z } from 'zod';

export const getBlockWithTxHashes = async (
  provider: RpcProvider,
  params: z.infer<typeof blockIdSchema>
) => {
  try {
    const blockWithTxHashes = await provider.getBlockWithTxHashes(
      params.blockId
    );

    return {
      status: 'success',
      blockWithTxHashes: blockWithTxHashes as any,
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
