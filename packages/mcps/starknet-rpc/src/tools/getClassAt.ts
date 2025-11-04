import { RpcProvider } from 'starknet';
import { getClassAtSchema } from '../schemas/index.js';
import { z } from 'zod';

export const getClassAt = async (
  provider: RpcProvider,
  params: z.infer<typeof getClassAtSchema>
) => {
  try {
    const contractClass = await provider.getClassAt(
      params.contractAddress,
      params.blockId
    );

    return {
      status: 'success',
      contractClass,
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
