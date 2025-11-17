import { Call } from 'starknet';
import { IBaseToken, Address } from '../../interfaces/index.js';
import { Hex, toBN } from './num.js';
import { getErc20Contract } from './contracts.js';

/**
 * Retrieves token balance for a given wallet address
 * @param {IBaseToken} baseToken - The token to check balance for
 * @param {Hex} walletAddress - The wallet address to check
 * @returns {Promise<bigint>} Token balance
 */
export async function getTokenBalance(
  baseToken: IBaseToken,
  walletAddress: Hex
): Promise<bigint> {
  const tokenContract = getErc20Contract(baseToken.address);

  return await tokenContract
    .balanceOf(walletAddress)
    .then(toBN)
    .catch(() => {
      console.error(new Error(`Failed to get balance of ${baseToken.address}`));
      return 0n;
    });
}

/**
 * Formats amount to the correct decimal places for the token
 * Converts human-readable decimal amount (e.g., "1.5") to token decimals format (e.g., "1500000" for 1.5 USDC with 6 decimals)
 * @param {string} amount - The amount as a string in human decimal format (e.g., "0.0001")
 * @param {number} decimals - Number of decimal places for the token
 * @returns {string} Formatted amount as a string without decimal point
 */
export const formatTokenAmount = (amount: string, decimals: number): string => {
  const [whole, fraction = ''] = amount.split('.');
  const paddedFraction = fraction.padEnd(decimals, '0');
  return whole + paddedFraction;
};

/**
 * Generates approval call for vToken operations
 * @param {Address} assetAddress - Address of the asset to approve
 * @param {Address} vTokenAddress - Address of the vToken
 * @param {bigint} amount - Amount to approve
 * @returns {Promise<Call>} Approval transaction call
 */
export async function approveVTokenCalls(
  assetAddress: Address,
  vTokenAddress: Address,
  amount: bigint
): Promise<Call> {
  const tokenContract = getErc20Contract(assetAddress);

  const approveCall = tokenContract.populateTransaction.approve(
    vTokenAddress,
    amount
  );

  return approveCall;
}
