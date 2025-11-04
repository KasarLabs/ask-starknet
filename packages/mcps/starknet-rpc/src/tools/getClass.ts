import { RpcProvider } from 'starknet';
import { blockIdAndContractAddressSchema } from '../schemas/index.js';
import { z } from 'zod';

export const getClass = async (
  provider: RpcProvider,
  params: z.infer<typeof blockIdAndContractAddressSchema>
) => {
  try {
    const contractClass = await provider.getClass(
      params.classHash,
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
