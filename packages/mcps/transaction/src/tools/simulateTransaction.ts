import { Account, TransactionType } from 'starknet';
import {
  Invocation_Invoke,
  Invocation_Deploy_Account,
  SimulateDeployTransactionAccountParams,
  SimulateInvokeTransactionParams,
  SimulateDeployTransactionParams,
  Invocation_Deploy,
  SimulateDeclareTransactionAccountParams,
  Invocation_Declare,
} from '../lib/types/simulateTransactionTypes.js';

import { TransactionReponseFormat } from '../lib/utils/outputSimulateTransaction.js';
import { DEFAULT_NONCE } from '../lib/constant/index.js';
import { onchainWrite } from '@ask-starknet/core';

/**
 * Simulates invoke transaction
 * @param {onchainWrite | onchainRead} env - The onchain environment
 * @param {SimulateInvokeTransactionParams} params - Transaction parameters
 * @returns {Promise<string>} JSON string with simulation result
 */
export const simulateInvokeTransaction = async (
  env: onchainWrite,
  params: SimulateInvokeTransactionParams
) => {
  try {
    const account = env.account;

    const invocations: Invocation_Invoke[] = params.payloads.map((payload) => {
      return {
        type: TransactionType.INVOKE,
        payload: {
          contractAddress: payload.contractAddress,
          entrypoint: payload.entrypoint,
          calldata: payload.calldata as string[],
        },
      };
    });

    const simulate_transaction = await account.simulateTransaction(invocations);

    const transaction_output = TransactionReponseFormat(simulate_transaction);

    return {
      status: 'success',
      transaction_output: transaction_output,
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Simulates deploy account transaction
 * @param {onchainWrite | onchainRead} env - The onchain environment
 * @param {SimulateDeployTransactionAccountParams} params - Deploy account parameters
 * @returns {Promise<string>} JSON string with simulation result
 */
export const simulateDeployAccountTransaction = async (
  env: onchainWrite,
  params: SimulateDeployTransactionAccountParams
) => {
  try {
    const account = env.account;

    const invocations: Invocation_Deploy_Account[] = params.payloads.map(
      (payload) => {
        return {
          type: TransactionType.DEPLOY_ACCOUNT,
          payload: {
            classHash: payload.classHash,
            constructorCalldata: payload.constructorCalldata ?? [],
            addressSalt: payload.addressSalt,
            contractAddress: payload.contractAddress,
          },
        };
      }
    );

    const simulate_transaction = await account.simulateTransaction(
      invocations,
      {
        nonce: DEFAULT_NONCE,
      }
    );
    const transaction_output = TransactionReponseFormat(simulate_transaction);

    return {
      status: 'success',
      transaction_output: transaction_output,
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Simulates deploy transaction
 * @param {onchainWrite | onchainRead} env - The onchain environment
 * @param {SimulateDeployTransactionParams} params - Deploy parameters
 * @returns {Promise<string>} JSON string with simulation result
 */
export const simulateDeployTransaction = async (
  env: onchainWrite,
  params: SimulateDeployTransactionParams
) => {
  try {
    const account = env.account;

    const invocations: Invocation_Deploy[] = params.payloads.map((payload) => {
      return {
        type: TransactionType.DEPLOY,
        payload: {
          classHash: payload.classHash,
          salt: payload.salt,
          constructorCalldata: payload.constructorCalldata,
          unique: payload.unique,
        },
      };
    });

    const simulate_transaction = await account.simulateTransaction(invocations);

    const transaction_output = TransactionReponseFormat(simulate_transaction);

    return {
      status: 'success',
      transaction_output: transaction_output,
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Simulates declare transaction
 * @param {onchainWrite | onchainRead} env - The onchain environment
 * @param {SimulateDeclareTransactionAccountParams} params - Declare parameters
 * @returns {Promise<string>} JSON string with simulation result
 */
export const simulateDeclareTransaction = async (
  env: onchainWrite,
  params: SimulateDeclareTransactionAccountParams
) => {
  try {
    const account = env.account;

    const invocations: Invocation_Declare[] = [
      {
        type: TransactionType.DECLARE,
        payload: {
          contract: params.contract,
          classHash: params.classHash,
          casm: params.casm,
          compiledClassHash: params.compiledClassHash,
        },
      },
    ];

    const simulate_transaction = await account.simulateTransaction(invocations);
    const transaction_output = TransactionReponseFormat(simulate_transaction);

    return {
      status: 'success',
      transaction_output: transaction_output,
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
