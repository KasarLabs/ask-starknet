import { RpcProvider } from 'starknet';
import { getClassHashAtSchema } from '../schemas/index.js';
import { z } from 'zod';

export const getClassHashAt = async (
  provider: RpcProvider,
  params: z.infer<typeof getClassHashAtSchema>
) => {
  try {
    const classHash = await provider.getClassHashAt(
      params.contractAddress,
      params.blockId
    );

    return {
      status: 'success',
      classHash,
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
