import { RpcProvider } from 'starknet';
import { toolResult } from '@kasarlabs/ask-starknet-core';

export const getClassHash = async (
  provider: RpcProvider,
  params: { contractAddress: string; blockId?: string }
): Promise<toolResult> => {
  try {
    const classHash = await provider.getClassHashAt(
      params.contractAddress,
      params.blockId
    );

    return {
      status: 'success',
      data: { classHash, },
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
