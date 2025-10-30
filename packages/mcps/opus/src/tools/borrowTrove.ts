import { BorrowTroveParams } from '../schemas/index.js';
import { createTroveManager } from '../lib/utils/troveManager.js';
import { onchainWrite } from '@kasarlabs/ask-starknet-core';

export const borrowTrove = async (
  env: onchainWrite,
  params: BorrowTroveParams
) => {
  const accountAddress = env.account?.address;

  try {
    const troveManager = createTroveManager(env, accountAddress);
    const result = await troveManager.borrowTransaction(params, env);
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
