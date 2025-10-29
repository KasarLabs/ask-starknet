import { Account, shortString, cairo } from 'starknet';
import { onchainWrite } from '@kasarlabs/ask-starknet-core';
import { ContractManager } from '../lib/utils/contractManager.js';
import { deployERC20Schema } from '../schemas/index.js';
import {
  ERC20_CLASSHASH_SEPOLIA,
  ERC20_CLASSHASH_MAINNET,
} from '../lib/constants/constant.js';
import {
  NEW_ERC20_ABI_SEPOLIA,
  NEW_ERC20_ABI_MAINNET,
} from '../lib/abis/new.js';
import { z } from 'zod';

/**
 * Deploys a new ERC20 token contract on StarkNet
 * @param {onchainWrite} env - The onchain write environment
 * @param {z.infer<typeof deployERC20Schema>} params - ERC20 deployment parameters validated by Zod schema
 * @returns {Promise<string>} JSON stringified response with deployment status and contract details
 * @throws {Error} If deployment fails
 */
export const deployERC20Contract = async (
  env: onchainWrite,
  params: z.infer<typeof deployERC20Schema>
) => {
  try {
    const provider = env.provider;
    const account = env.account;

    const contractManager = new ContractManager(account);

    const chainId = shortString.decodeShortString(await provider.getChainId());
    const classhash =
      chainId === 'SN_MAIN' ? ERC20_CLASSHASH_MAINNET : ERC20_CLASSHASH_SEPOLIA;
    const abi =
      chainId === 'SN_MAIN' ? NEW_ERC20_ABI_MAINNET : NEW_ERC20_ABI_SEPOLIA;

    const response = await contractManager.deployContract(
      classhash as string,
      abi,
      [
        params.name,
        params.symbol,
        cairo.uint256(params.totalSupply.toString()),
        account.address,
      ]
    );

    return {
      status: 'success',
      transactionHash: response.transactionHash,
      contractAddress: response.contractAddress,
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
