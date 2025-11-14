import { RpcProvider } from 'starknet';
import { blockIdAndContractAddressSchema } from '../schemas/index.js';
import { z } from 'zod';
import { toolResult } from '@kasarlabs/ask-starknet-core';

export const getClass = async (
  provider: RpcProvider,
  params: z.infer<typeof blockIdAndContractAddressSchema>
): Promise<toolResult> => {
  try {
    const contractClass = await provider.getClass(
      params.classHash,
      params.blockId
    );

    return {
      status: 'success',
      data: { contractClass, },
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
