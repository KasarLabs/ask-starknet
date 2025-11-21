import { z } from 'zod';
import { getConstructorParamsSchema } from '../schemas/index.js';
import {
  validateFilePaths,
  formatContractError,
  ContractManager,
} from '../lib/index.js';
import { Account, RpcProvider } from 'starknet';
import { toolResult } from '@kasarlabs/ask-starknet-core';

/**
 * Get constructor parameters from a contract sierra file
 * @param params Parameters including sierra file path and class hash
 * @returns JSON string with constructor parameters
 */
export const getConstructorParams = async (
  params: z.infer<typeof getConstructorParamsSchema>
): Promise<toolResult> => {
  try {
    // Validate file paths exist
    await validateFilePaths(params.sierraFilePath, params.casmFilePath); // Only need sierra for constructor params

    // Create a dummy account for ContractManager (not used for this operation)
    const provider = new RpcProvider({
      nodeUrl: 'https://starknet-mainnet.public.blastapi.io',
    });
    const dummyAccount = new Account({
      provider,
      address: '0x1',
      signer: '0x1',
    });

    const contractManager = new ContractManager(dummyAccount);
    await contractManager.loadContractCompilationFiles(
      params.sierraFilePath,
      params.casmFilePath
    );

    const constructorParams = contractManager.extractConstructorParams();

    return {
      status: 'success',
      data: {
        classHash: params.classHash,
        sierraFilePath: params.sierraFilePath,
        message: 'Constructor parameters retrieved successfully',
        parameterCount: constructorParams.length,
        parameters: constructorParams.map((param: any, index: number) => ({
          index,
          name: param.name,
          type: param.type,
        })),
      },
    };
  } catch (error) {
    const errorMessage = formatContractError(error);
    return {
      status: 'failure',
      error: errorMessage,
    };
  }
};
