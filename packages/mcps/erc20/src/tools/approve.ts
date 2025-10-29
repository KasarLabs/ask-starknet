import { Account, Contract, RpcProvider, constants } from 'starknet';
import { onchainWrite } from '@ijusttookadnatest/core';
import {
  validateAndFormatParams,
  executeV3Transaction,
  validateToken,
  detectAbiType,
  extractAssetInfo,
} from '../lib/utils/utils.js';
import { z } from 'zod';
import { approveSchema, approveSignatureSchema } from '../schemas/index.js';
import { validToken } from '../lib/types/types.js';

/**
 * Approves token spending
 * @param {onchainWrite} env - The onchain write environment
 * @param {ApproveParams} params - Approval parameters
 * @returns {Promise<string>} JSON string with transaction result
 * @throws {Error} If approval fails
 */
export const approve = async (
  env: onchainWrite,
  params: z.infer<typeof approveSchema>
) => {
  try {
    const provider = env.provider;
    const account = env.account;

    const { assetSymbol, assetAddress } = extractAssetInfo(params.asset);

    const token = await validateToken(provider, assetSymbol, assetAddress);
    const abi = await detectAbiType(token.address, provider);
    const { address, amount } = validateAndFormatParams(
      params.spenderAddress,
      params.amount,
      token.decimals
    );

    const spenderAddress = address;

    const contract = new Contract(abi, token.address, provider);
    contract.connect(account);

    const calldata = contract.populate('approve', [spenderAddress, amount]);

    const txH = await executeV3Transaction({
      call: calldata,
      account: account,
    });

    return {
      status: 'success',
      amount: params.amount,
      symbol: token.symbol,
      spender_address: spenderAddress,
      transactionHash: txH,
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
      step: 'transfer execution',
    };
  }
};
