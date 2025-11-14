import { RpcProvider } from 'starknet';
import { toolResult } from '@kasarlabs/ask-starknet-core';

export const getTransactionTrace = async (
  provider: RpcProvider,
  params: { transactionHash: string }
): Promise<toolResult> => {
  try {
    const transactionTrace = await provider.getTransactionTrace(
      params.transactionHash
    );

    return {
      status: 'success',
      data: { transactionTrace, },
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
