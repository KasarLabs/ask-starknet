import { RpcProvider } from 'starknet';
import { toolResult } from '@kasarlabs/ask-starknet-core';

export const getTransactionReceipt = async (
  provider: RpcProvider,
  params: { transactionHash: string }
): Promise<toolResult> => {
  try {
    const transactionReceipt = await provider.getTransactionReceipt(
      params.transactionHash
    );

    return {
      status: 'success',
      data: { transactionReceipt, },
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
