import { Account, shortString } from 'starknet';

import { ContractManager } from '../../lib/utils/contractManager.js';
import {
  ERC721_CLASSHASH_SEPOLIA,
  ERC721_CLASSHASH_MAINNET,
} from '../../lib/constant/constant.js';
import { deployERC721Schema } from '../../schemas/index.js';
import {
  DEPLOY_ERC721_ABI_SEPOLIA,
  DEPLOY_ERC721_ABI_MAINNET,
} from '../../lib/abis/deploy.js';
import { z } from 'zod';
import { onchainWrite, toolResult } from '@kasarlabs/ask-starknet-core';

/**
 * Deploys an ERC721 contract.
 * @param agent - A SnakAgentInterface instance.
 * @param params - An object containing the contract's name, symbol, base URI, and total supply.
 * @returns A stringified JSON object containing the status, transaction hash, and contract address.
 */
export const deployERC721Contract = async (
  env: onchainWrite,
  params: z.infer<typeof deployERC721Schema>
): Promise<toolResult> => {
  try {
    const provider = env.provider;
    const account = env.account;

    const contractManager = new ContractManager(account);

    const chainId = shortString.decodeShortString(await provider.getChainId());
    const classhash =
      chainId === 'SN_MAIN'
        ? ERC721_CLASSHASH_MAINNET
        : ERC721_CLASSHASH_SEPOLIA;
    const abi =
      chainId === 'SN_MAIN'
        ? DEPLOY_ERC721_ABI_MAINNET
        : DEPLOY_ERC721_ABI_SEPOLIA;

    const response = await contractManager.deployContract(
      classhash as string,
      abi,
      {
        name: params.name,
        symbol: params.symbol,
        base_uri: params.baseUri,
        total_supply: params.totalSupply,
        recipient: account.address,
      }
    );

    return {
      status: 'success',
      data: {
        transactionHash: response.transactionHash,
        contractAddress: response.contractAddress,
      },
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
