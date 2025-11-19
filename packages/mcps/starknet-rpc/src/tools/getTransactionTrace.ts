import { RpcProvider } from 'starknet';

export const getTransactionTrace = async (
  provider: RpcProvider,
  params: { transactionHash: string }
): Promise<
  | {
      status: 'success';
      transactionTrace: Awaited<ReturnType<RpcProvider['getTransactionTrace']>>;
    }
  | { status: 'failure'; error: string }
> => {
  try {
    const transactionTrace = await provider.getTransactionTrace(
      params.transactionHash
    );

    return {
      status: 'success',
      transactionTrace,
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
