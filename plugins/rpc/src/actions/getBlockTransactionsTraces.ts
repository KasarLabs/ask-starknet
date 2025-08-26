import { BlockIdParams } from '../schema/index.js';
import { SnakAgentInterface } from '../dependances/types.js';

export const getBlockTransactionsTraces = async (
  agent: SnakAgentInterface,
  params: BlockIdParams
) => {
  const provider = agent.getProvider();

  try {
    const { blockId } = params;
    const transactionTraces =
      await provider.getBlockTransactionsTraces(blockId);
    return JSON.stringify({
      status: 'success',
      transactionTraces,
    });
  } catch (error) {
    return JSON.stringify({
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
