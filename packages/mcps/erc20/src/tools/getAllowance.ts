import { Contract } from 'starknet';
import { onchainWrite } from '@ijusttookadnatest/core';
import {
  formatBalance,
  validateToken,
  detectAbiType,
  extractAssetInfo,
} from '../lib/utils/utils.js';
import { z } from 'zod';
import {
  getAllowanceSchema,
  getMyGivenAllowanceSchema,
  getAllowanceGivenToMeSchema,
} from '../schemas/index.js';

/**
 * Gets the amount of tokens that a spender is allowed to spend on behalf of an owner.
 * @param {onchainWrite} env - The onchain write environment
 * @param {AllowanceParams} params - The owner, spender and token addresses
 * @returns {Promise<string>} JSON string with allowance amount
 * @throws {Error} If operation fails
 */
export const getAllowance = async (
  env: onchainWrite,
  params: z.infer<typeof getAllowanceSchema>
) => {
  try {
    const provider = env.provider;

    const { assetSymbol, assetAddress } = extractAssetInfo(params.asset);

    const token = await validateToken(
      provider,
      assetSymbol || undefined,
      assetAddress || undefined
    );
    const abi = await detectAbiType(token.address, provider);

    const tokenContract = new Contract(abi, token.address, provider);

    const allowanceResponse = await tokenContract.allowance(
      params.ownerAddress,
      params.spenderAddress
    );

    return {
      status: 'success',
      owner: params.ownerAddress,
      spender: params.spenderAddress,
      allowance: formatBalance(allowanceResponse, token.decimals),
      symbol: token.symbol,
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Gets allowances granted by the current user
 * @param {onchainWrite} env - The onchain write environment
 * @param {MyGivenAllowanceParams} params - The spender and token addresses
 * @returns {Promise<string>} JSON string with allowance amount
 * @throws {Error} If operation fails
 */
export const getMyGivenAllowance = async (
  env: onchainWrite,
  params: z.infer<typeof getMyGivenAllowanceSchema>
) => {
  try {
    const provider = env.provider;
    const ownerAddress = env.account.address;

    const { assetSymbol, assetAddress } = extractAssetInfo(params.asset);

    const token = await validateToken(
      provider,
      assetSymbol || undefined,
      assetAddress || undefined
    );
    const abi = await detectAbiType(token.address, provider);

    const tokenContract = new Contract(abi, token.address, provider);

    const allowanceResponse = await tokenContract.allowance(
      ownerAddress,
      params.spenderAddress
    );

    return {
      status: 'success',
      owner: ownerAddress,
      spender: params.spenderAddress,
      allowance: formatBalance(allowanceResponse, token.decimals),
      symbol: token.symbol,
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Gets allowances granted to the current user
 * @param {onchainWrite} env - The onchain write environment
 * @param {AllowanceGivenToMeParams} params - The owner and token addresses
 * @returns {Promise<string>} JSON string with allowance amount
 * @throws {Error} If operation fails
 */
export const getAllowanceGivenToMe = async (
  env: onchainWrite,
  params: z.infer<typeof getAllowanceGivenToMeSchema>
) => {
  try {
    const provider = env.provider;
    const spenderAddress = env.account.address;

    const { assetSymbol, assetAddress } = extractAssetInfo(params.asset);

    const token = await validateToken(
      provider,
      assetSymbol || undefined,
      assetAddress || undefined
    );
    const abi = await detectAbiType(token.address, provider);

    const tokenContract = new Contract(abi, token.address, provider);

    const allowanceResponse = await tokenContract.allowance(
      params.ownerAddress,
      spenderAddress
    );

    return {
      status: 'success',
      owner: params.ownerAddress,
      spender: spenderAddress,
      allowance: formatBalance(allowanceResponse, token.decimals),
      symbol: token.symbol,
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
