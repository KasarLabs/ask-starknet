import { TransactionHashParams } from '../schema/index.js';
import { SnakAgentInterface } from './dependances/types';

export const getTransactionTrace = async (
  agent: SnakAgentInterface,
  params: TransactionHashParams
) => {
  const provider = agent.getProvider();

  try {
    const { transactionHash } = params;
    const transactionTrace =
      await provider.getTransactionTrace(transactionHash);
    return JSON.stringify({
      status: 'success',
      transactionTrace,
    });
  } catch (error) {
    return JSON.stringify({
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
