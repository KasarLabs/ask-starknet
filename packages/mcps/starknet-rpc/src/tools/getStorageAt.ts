import { RpcProvider } from 'starknet';
import { getStorageAtSchema } from '../schemas/index.js';
import { z } from 'zod';

export const getStorageAt = async (
  provider: RpcProvider,
  params: z.infer<typeof getStorageAtSchema>
) => {
  try {
    const storageValue = await provider.getStorageAt(
      params.contractAddress,
      params.key,
      params.blockId
    );

    return {
      status: 'success',
      storageValue,
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
