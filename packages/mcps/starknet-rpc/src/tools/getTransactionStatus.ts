import { RpcProvider } from 'starknet';
import { transactionHashSchema } from '../schemas/index.js';
import { z } from 'zod';

export const getTransactionStatus = async (
  provider: RpcProvider,
  params: z.infer<typeof transactionHashSchema>
) => {
  try {
    const transactionStatus = await provider.getTransactionStatus(
      params.transactionHash
    );

    return {
      status: 'success',
      transactionStatus: transactionStatus as any,
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
