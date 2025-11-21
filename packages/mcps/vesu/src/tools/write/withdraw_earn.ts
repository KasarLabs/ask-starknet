import { Account, Contract } from 'starknet';
import { WithdrawParams, WithdrawResult } from '../../interfaces/index.js';
import { GENESIS_POOLID } from '../../lib/constants/index.js';
import { Hex, toU256, toBN } from '../../lib/utils/num.js';
import { vTokenAbi } from '../../lib/abis/vTokenAbi.js';
import { getPool } from '../../lib/utils/pools.js';
import { formatTokenAmount } from '../../lib/utils/tokens.js';
import { onchainWrite, toolResult } from '@kasarlabs/ask-starknet-core';

/**
 * Service for managing withdrawal operations from earning positions
 * @class WithdrawEarnService
 */
export class WithdrawEarnService {
  /**
   * Creates an instance of WithdrawEarnService
   * @param {onchainWrite} env - The onchain environment
   * @param {string} walletAddress - The wallet address executing the withdrawals
   */
  constructor(
    private env: onchainWrite,
    private walletAddress: string
  ) {}

  /**
   * Executes a withdrawal transaction
   * @param {WithdrawParams} params - Withdrawal parameters
   * @param {onchainWrite | onchainRead} env - The onchain environment
   * @returns {Promise<WithdrawResult>} Result of the withdrawal operation
   */
  async withdrawEarnTransaction(
    params: WithdrawParams,
    env: onchainWrite
  ): Promise<WithdrawResult> {
    try {
      const account = new Account(
        this.env.provider,
        this.walletAddress,
        this.env.account.signer
      );
      const poolId = params.poolId || GENESIS_POOLID;
      const pool = await getPool(poolId);

      const collateralPoolAsset = pool.assets.find(
        (a) =>
          a.symbol.toUpperCase() === params.withdrawTokenSymbol.toUpperCase()
      );

      if (!collateralPoolAsset) {
        throw new Error('Collateral asset not found in pool');
      }

      // Use the environment provider to get the vToken contract
      const vtokenContract = new Contract(
        vTokenAbi,
        collateralPoolAsset.vToken.address,
        env.provider
      ).typedv2(vTokenAbi);

      // Get vToken balance using the contract directly with the environment provider
      const vTokenShares = await vtokenContract
        .balance_of(account.address)
        .then((result: any) => toBN(result))
        .catch((error: any) => {
          throw new Error(`Failed to get vToken balance: ${error.message}`);
        });

      // Determine the amount to withdraw (in vToken shares)
      let amountToWithdraw: bigint;
      if (params.withdrawAmount && params.withdrawAmount !== '0') {
        // Convert human decimal amount to token decimals format (assets)
        const formattedAmount = formatTokenAmount(
          params.withdrawAmount,
          collateralPoolAsset.decimals
        );
        const assetsAmount = BigInt(formattedAmount);

        // Convert assets amount to vToken shares using convert_to_shares
        // This is more accurate than preview_withdraw as it doesn't include fees
        const sharesNeeded = await vtokenContract
          .convert_to_shares(toU256(assetsAmount))
          .then((result: any) => toBN(result))
          .catch(() => {
            throw new Error('Failed to convert assets to shares');
          });

        // Ensure we don't withdraw more than available
        if (sharesNeeded > vTokenShares) {
          throw new Error(
            `Insufficient balance. Available shares: ${vTokenShares}, Required shares: ${sharesNeeded}`
          );
        }

        amountToWithdraw = sharesNeeded;
      } else {
        // Withdraw all available shares
        amountToWithdraw = vTokenShares;
      }

      const provider = env.provider;

      const wallet = env.account;

      const redeemVTokenCall = await vtokenContract.populateTransaction.redeem(
        toU256(amountToWithdraw),
        account.address,
        account.address
      );

      const tx = await wallet.execute([
        {
          contractAddress: redeemVTokenCall.contractAddress,
          entrypoint: redeemVTokenCall.entrypoint,
          calldata: redeemVTokenCall.calldata,
        },
      ]);

      await provider.waitForTransaction(tx.transaction_hash);

      const transferResult: WithdrawResult = {
        status: 'success',
        symbol: params.withdrawTokenSymbol,
        recipient_address: account.address,
        transaction_hash: tx.transaction_hash,
      };

      return transferResult;
    } catch (error) {
      console.error('Detailed withdraw error:', error);
      if (error instanceof Error) {
        // console.error('Error type:', error.constructor.name);
        // console.error('Error message:', error.message);
        // console.error('Error stack:', error.stack);
      }
      return {
        status: 'failure',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Creates a new WithdrawEarnService instance
 * @param {onchainWrite} env - The onchain environment
 * @param {string} [walletAddress] - The wallet address
 * @returns {WithdrawEarnService} A new WithdrawEarnService instance
 * @throws {Error} If wallet address is not provided
 */
export const withdrawService = (
  env: onchainWrite,
  walletAddress?: string
): WithdrawEarnService => {
  if (!walletAddress) {
    throw new Error('Wallet address not configured');
  }

  return new WithdrawEarnService(env, walletAddress);
};

/**
 * Utility function to execute a withdrawal operation
 * @param {onchainWrite} env - The onchain environment
 * @param {WithdrawParams} params - The withdrawal parameters
 * @returns {Promise<string>} JSON string containing the withdrawal result
 */
export const withdrawEarnPosition = async (
  env: onchainWrite,
  params: WithdrawParams
): Promise<toolResult> => {
  const accountAddress = env.account?.address;
  try {
    const withdrawEarn = withdrawService(env, accountAddress);
    const result = await withdrawEarn.withdrawEarnTransaction(params, env);
    return result;
  } catch (error) {
    // console.error('Detailed withdraw error:', error);
    if (error instanceof Error) {
      // console.error('Error type:', error.constructor.name);
      // console.error('Error message:', error.message);
      // console.error('Error stack:', error.stack);
    }
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
