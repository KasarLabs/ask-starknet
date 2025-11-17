import { Account } from 'starknet';
import { WithdrawParams, WithdrawResult } from '../../interfaces/index.js';
import { GENESIS_POOLID } from '../../lib/constants/index.js';
import { Hex, toU256 } from '../../lib/utils/num.js';
import { getVTokenContract } from '../../lib/utils/contracts.js';
import { getPool } from '../../lib/utils/pools.js';
import { getTokenBalance } from '../../lib/utils/tokens.js';
import { onchainWrite } from '@kasarlabs/ask-starknet-core';

/**
 * Service for managing withdrawal operations from earning positions
 * @class WithdrawEarnService
 */
export class WithdrawEarnService {
  /**
   * Creates an instance of WithdrawEarnService
   * @param {onchainWrite | onchainRead} env - The onchain environment
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
      const poolId = params.pool_id || GENESIS_POOLID;
      const pool = await getPool(poolId);

      const collateralPoolAsset = pool.assets.find(
        (a) =>
          a.symbol.toLocaleUpperCase() ===
          params.withdrawTokenSymbol.toLocaleUpperCase()
      );

      if (!collateralPoolAsset) {
        throw new Error('Collateral asset not found in pool');
      }

      const vtokenContract = getVTokenContract(
        collateralPoolAsset.vToken.address
      );

      const vTokenShares = await getTokenBalance(
        collateralPoolAsset.vToken,
        account.address as Hex
      );

      const provider = env.provider;

      const wallet = env.account;

      const redeemVTokenCall = await vtokenContract.populateTransaction.redeem(
        toU256(vTokenShares),
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
        recipients_address: account.address,
        transaction_hash: tx.transaction_hash,
      };

      return transferResult;
    } catch (error) {
      console.error('Detailed deposit error:', error);
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
 * @param {onchainWrite | onchainRead} env - The onchain environment
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
 * @param {onchainWrite | onchainRead} env - The onchain environment
 * @param {WithdrawParams} params - The withdrawal parameters
 * @returns {Promise<string>} JSON string containing the withdrawal result
 */
export const withdrawEarnPosition = async (
  env: onchainWrite,
  params: WithdrawParams
) => {
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

/**
 * Default withdraw function - executes a withdrawal operation
 * @param {onchainWrite} env - The onchain environment
 * @param {WithdrawParams} params - The withdrawal parameters
 * @returns {Promise<WithdrawResult>} Result of the withdrawal operation
 */
export const withdraw = withdrawEarnPosition;
