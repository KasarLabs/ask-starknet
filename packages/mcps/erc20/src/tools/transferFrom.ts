import {
  Account,
  Contract,
  validateAndParseAddress,
  constants,
} from 'starknet';
import { onchainWrite } from '@kasarlabs/ask-starknet-core';
import {
  validateAndFormatParams,
  executeV3Transaction,
  validateToken,
  detectAbiType,
  extractAssetInfo,
} from '../lib/utils/utils.js';
import { z } from 'zod';
import {
  transferFromSchema,
  transferFromSignatureSchema,
} from '../schemas/index.js';
import { RpcProvider } from 'starknet';

/**
 * Transfers tokens from one address to another using an allowance.
 * @param {onchainWrite} env - The onchain write environment
 * @param {TransferFromParams} params - Transfer parameters
 * @returns {Promise<string>} JSON string with transaction result
 * @throws {Error} If transfer fails
 */
export const transferFrom = async (
  env: onchainWrite,
  params: z.infer<typeof transferFromSchema>
) => {
  try {
    const account = env.account;
    const provider = env.provider;

    const { assetSymbol, assetAddress } = extractAssetInfo(params.asset);

    const token = await validateToken(provider, assetSymbol, assetAddress);
    const abi = await detectAbiType(token.address, provider);
    const { address, amount } = validateAndFormatParams(
      params.fromAddress,
      params.amount,
      token.decimals
    );

    const fromAddress = address;
    const toAddress = validateAndParseAddress(params.toAddress);

    const contract = new Contract(abi, token.address, provider);

    contract.connect(account);

    const calldata = contract.populate('transfer_from', [
      fromAddress,
      toAddress,
      amount,
    ]);

    const txH = await executeV3Transaction({
      call: calldata,
      account: account,
    });

    return {
      status: 'success',
      transactionHash: txH,
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
