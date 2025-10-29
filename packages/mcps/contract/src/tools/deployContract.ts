import { z } from 'zod';
import { getOnchainWrite } from '@ijusttookadnatest/core';
import { deployContractSchema } from '../schemas/index.js';
import {
  validateFilePaths,
  formatContractError,
  ContractManager,
} from '../lib/index.js';
/**
 * Deploy a contract on Starknet using file path approach
 * @param params Contract deployment parameters
 * @returns JSON string with deployment result
 */
export const deployContract = async (
  params: z.infer<typeof deployContractSchema>
) => {
  try {
    // Validate file paths exist
    // await validateFilePaths(params.sierraFilePath, params.casmFilePath);

    // Setup provider and account
    const { provider, account } = getOnchainWrite();

    // Load contract files and deploy
    const contractManager = new ContractManager(account);
    await contractManager.loadContractCompilationFiles(
      params.sierraFilePath,
      params.casmFilePath
    );
    await contractManager.loadAbiFile();

    const deployResponse = await contractManager.deployContract(
      params.classHash,
      params.constructorArgs || []
    );

    return {
      status: 'success',
      transactionHash: deployResponse.transaction_hash,
      contractAddress: deployResponse.contract_address,
      classHash: params.classHash,
      constructorArgs: params.constructorArgs || [],
      sierraFilePath: params.sierraFilePath,
      casmFilePath: params.casmFilePath,
      message: 'Contract deployed successfully',
    };
  } catch (error) {
    const errorMessage = formatContractError(error);
    return {
      status: 'failure',
      error: errorMessage,
      step: 'contract deployment',
      classHash: params.classHash,
      constructorArgs: params.constructorArgs || [],
      sierraFilePath: params.sierraFilePath,
      casmFilePath: params.casmFilePath,
    };
  }
};
