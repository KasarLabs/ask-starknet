import { RpcProvider } from 'starknet';
import { transactionHashSchema } from '../schemas/index.js';
import { z } from 'zod';
import { toolResult } from '@kasarlabs/ask-starknet-core';

export const getTransactionStatus = async (
  provider: RpcProvider,
  params: z.infer<typeof transactionHashSchema>
): Promise<toolResult> => {
  try {
    const transactionStatus = await provider.getTransactionStatus(
      params.transactionHash
    );

    return {
      status: 'success',
      data: { transactionStatus: transactionStatus as any, },
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
