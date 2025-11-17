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
