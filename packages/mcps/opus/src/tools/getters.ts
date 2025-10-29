import { GetTroveHealthParams, GetUserTrovesParams } from '../schemas/index.js';
import { createTroveManager } from '../lib/utils/troveManager.js';
import { onchainWrite } from '@ijusttookadnatest/core';

export const getUserTroves = async (
  env: onchainWrite,
  params: GetUserTrovesParams
) => {
  const accountAddress = env.account?.address;

  try {
    const TroveManager = createTroveManager(env, accountAddress);
    const result = await TroveManager.getUserTroves(params);
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

export const getTroveHealth = async (
  env: onchainWrite,
  params: GetTroveHealthParams
) => {
  const accountAddress = env.account?.address;

  try {
    const troveManager = createTroveManager(env, accountAddress);
    const result = await troveManager.getTroveHealth(params);
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

export const getBorrowFee = async (env: onchainWrite) => {
  const accountAddress = env.account?.address;

  try {
    const TroveManager = createTroveManager(env, accountAddress);
    const result = await TroveManager.getBorrowFee();
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
