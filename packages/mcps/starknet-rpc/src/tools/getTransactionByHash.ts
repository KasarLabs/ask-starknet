import { RpcProvider } from 'starknet';
import { toolResult } from '@kasarlabs/ask-starknet-core';

export const getTransactionByHash = async (
  provider: RpcProvider,
  params: { transactionHash: string }
): Promise<toolResult> => {
  try {
    const transaction = await provider.getTransactionByHash(
      params.transactionHash
    );

    return {
      status: 'success',
      data: { transaction: transaction as any },
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
