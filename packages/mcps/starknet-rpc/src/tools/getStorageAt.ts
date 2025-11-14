import { RpcProvider } from 'starknet';
import { getStorageAtSchema } from '../schemas/index.js';
import { z } from 'zod';
import { toolResult } from '@kasarlabs/ask-starknet-core';

export const getStorageAt = async (
  provider: RpcProvider,
  params: z.infer<typeof getStorageAtSchema>
): Promise<toolResult> => {
  try {
    const storageValue = await provider.getStorageAt(
      params.contractAddress,
      params.key,
      params.blockId
    );

    return {
      status: 'success',
      data: { storageValue, },
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
