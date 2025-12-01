import { WithdrawTroveParams } from '../schemas/index.js';
import { createTroveManager } from '../lib/utils/troveManager.js';
import { onchainWrite, toolResult } from '@kasarlabs/ask-starknet-core';

export const withdrawTrove = async (
  env: onchainWrite,
  params: WithdrawTroveParams
): Promise<toolResult> => {
  const accountAddress = env.account?.address;

  try {
    const troveManager = createTroveManager(env, accountAddress);
    const result = await troveManager.withdrawTransaction(params, env);
    return {
      status: 'success',
      data: result,
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
