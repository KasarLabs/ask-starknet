import { SnakAgentInterface } from '../dependances/types.js';
import { RepayTroveParams } from '../schemas/index.js';
import { createTroveManager } from '../utils/troveManager.js';

export const repayTrove = async (
  agent: SnakAgentInterface,
  params: RepayTroveParams
): Promise<string> => {
  const accountAddress = agent.getAccountCredentials()?.accountPublicKey;

  try {
    const troveManager = createTroveManager(agent, accountAddress);
    const result = await troveManager.repayTransaction(params, agent);
    return JSON.stringify({
      status: 'success',
      data: result,
    });
  } catch (error) {
    return JSON.stringify({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
