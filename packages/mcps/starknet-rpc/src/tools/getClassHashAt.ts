import { RpcProvider } from 'starknet';
import { getClassHashAtSchema } from '../schemas/index.js';
import { z } from 'zod';
import { toolResult } from '@kasarlabs/ask-starknet-core';

export const getClassHashAt = async (
  provider: RpcProvider,
  params: z.infer<typeof getClassHashAtSchema>
): Promise<toolResult> => {
  try {
    const classHash = await provider.getClassHashAt(
      params.contractAddress,
      params.blockId
    );

    return {
      status: 'success',
      data: { classHash },
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
