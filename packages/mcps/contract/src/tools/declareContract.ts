import { z } from 'zod';
import { getOnchainWrite } from '@ijusttookadnatest/ask-starknet-core-test';
import { declareContractSchema } from '../schemas/index.js';
import {
  validateFilePaths,
  formatContractError,
  ContractManager,
} from '../lib/index.js';

/**
 * Declare a contract on Starknet using file path approach
 * @param params Contract declaration parameters
 * @returns JSON string with declaration result
 */
export const declareContract = async (
  params: z.infer<typeof declareContractSchema>
) => {
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
    const contractManagerForHash = new ContractManager(account);
    await contractManagerForHash.loadContractCompilationFiles(
      params.sierraFilePath,
      params.casmFilePath
    );
    const { classHash: calculatedClassHash } =
      await contractManagerForHash.isContractDeclared();

    return {
      status: 'success',
      transactionHash: declareResponse.transaction_hash || '',
      classHash: declareResponse.class_hash || calculatedClassHash,
      sierraFilePath: params.sierraFilePath,
      casmFilePath: params.casmFilePath,
      message: 'Contract declared successfully',
    };
  } catch (error) {
    const errorMessage = formatContractError(error);
    return {
      status: 'failure',
      error: errorMessage,
      step: 'contract declaration',
      sierraFilePath: params.sierraFilePath,
      casmFilePath: params.casmFilePath,
    };
  }
};
