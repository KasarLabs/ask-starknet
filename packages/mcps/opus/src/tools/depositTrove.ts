import { DepositTroveParams } from '../schemas/index.js';
import { createTroveManager } from '../lib/utils/troveManager.js';
import { onchainWrite } from '@ijusttookadnatest/ask-starknet-core-test';

export const depositTrove = async (
  env: onchainWrite,
  params: DepositTroveParams
) => {
  const accountAddress = env.account?.address;

  try {
    const troveManager = createTroveManager(env, accountAddress);
    const result = await troveManager.depositTransaction(params, env);
    return {
      status: 'success',
      data: result,
    };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
