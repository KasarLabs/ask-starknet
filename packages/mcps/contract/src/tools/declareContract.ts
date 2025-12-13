import { z } from 'zod';
import { getOnchainWrite, toolResult } from '@kasarlabs/ask-starknet-core';
import { declareContractSchema } from '../schemas/index.js';
import {
  validateFilePaths,
  formatContractError,
  ContractManager,
} from '../lib/index.js';
import { hash } from 'starknet';

/**
 * Declare a contract on Starknet using file path approach
 * @param params Contract declaration parameters
 * @returns JSON string with declaration result
 */
export const declareContract = async (
  params: z.infer<typeof declareContractSchema>
): Promise<toolResult> => {
  try {
    // Validate file paths exist
    await validateFilePaths(params.sierraFilePath, params.casmFilePath);

    // Setup provider and account
    const { provider, account } = getOnchainWrite();

    // Load and declare contract
    const contractManager = new ContractManager(account);
    await contractManager.loadContractCompilationFiles(
      params.sierraFilePath,
      params.casmFilePath
    );

    const declareResponse = await contractManager.declareContract();

    // Calculate class hash locally to ensure it's always returned
    const calculatedClassHash = hash.computeContractClassHash(
      contractManager.compiledSierra
    );

    return {
      status: 'success',
      data: {
        transactionHash: declareResponse.transaction_hash || '',
        classHash:
          declareResponse.class_hash?.toString() || calculatedClassHash,
        sierraFilePath: params.sierraFilePath,
        casmFilePath: params.casmFilePath,
        message: 'Contract declared successfully',
      },
    };
  } catch (error) {
    const errorMessage = formatContractError(error);
    return {
      status: 'failure',
      error: `${errorMessage} (step: contract declaration)`,
    };
  }
};
