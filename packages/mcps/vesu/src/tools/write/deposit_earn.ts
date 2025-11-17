import { Account } from 'starknet';
import { DepositParams, DepositResult } from '../../interfaces/index.js';
import { GENESIS_POOLID } from '../../lib/constants/index.js';
import { toU256 } from '../../lib/utils/num.js';
import { getVTokenContract } from '../../lib/utils/contracts.js';
import { getPool } from '../../lib/utils/pools.js';
import {
  approveVTokenCalls,
  formatTokenAmount,
} from '../../lib/utils/tokens.js';
import { onchainWrite } from '@kasarlabs/ask-starknet-core';

/**
 * Service for managing deposit operations and earning positions
 * @class DepositEarnService
 */
export class DepositEarnService {
  /**
   * Creates an instance of DepositEarnService
   * @param {onchainWrite | onchainRead} env - The onchain environment
   * @param {string} walletAddress - The wallet address executing the deposits
   */
  constructor(
    private env: onchainWrite,
    private walletAddress: string
  ) {}

  /**
   * Executes a deposit transaction
   * @param {DepositParams} params - Deposit parameters
   * @param {onchainWrite | onchainRead} env - The onchain environment
   * @returns {Promise<DepositResult>} Result of the deposit operation
   */
  async depositEarnTransaction(
    params: DepositParams,
    env: onchainWrite
  ): Promise<DepositResult> {
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
          params.depositTokenSymbol.toLocaleUpperCase()
      );

      if (!collateralPoolAsset) {
        throw new Error('Collateral asset not found in pool');
      }

      // Convert human decimal amount to token decimals format
      const formattedAmount = formatTokenAmount(
        params.depositAmount,
        collateralPoolAsset.decimals
      );
      const collateralAmount = BigInt(formattedAmount);

      const vtokenContract = getVTokenContract(
        collateralPoolAsset.vToken.address
      );

      const vTokenApproveCall = await approveVTokenCalls(
        collateralPoolAsset.address,
        collateralPoolAsset.vToken.address,
        collateralAmount
      );

      const depositVTokenCall =
        await vtokenContract.populateTransaction.deposit(
          toU256(collateralAmount),
          account.address
        );

      const provider = env.provider;

      const tx = await account.execute([
        {
          contractAddress: vTokenApproveCall.contractAddress,
          entrypoint: vTokenApproveCall.entrypoint,
          calldata: vTokenApproveCall.calldata,
        },
        {
          contractAddress: depositVTokenCall.contractAddress,
          entrypoint: depositVTokenCall.entrypoint,
          calldata: depositVTokenCall.calldata,
        },
      ]);

      await provider.waitForTransaction(tx.transaction_hash);
      const transferResult: DepositResult = {
        status: 'success',
        amount: params.depositAmount,
        symbol: params.depositTokenSymbol,
        recipients_address: account.address,
        transaction_hash: tx.transaction_hash,
      };

      return transferResult;
    } catch (error) {
      // console.error('Detailed deposit error:', error);
      if (error instanceof Error) {
        //     console.error('Error type:', error.constructor.name);
        //     console.error('Error message:', error.message);
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
 * Creates a new DepositEarnService instance
 * @param {onchainWrite | onchainRead} env - The onchain environment
 * @param {string} [walletAddress] - The wallet address
 * @returns {DepositEarnService} A new DepositEarnService instance
 * @throws {Error} If wallet address is not provided
 */
export const createDepositEarnService = (
  env: onchainWrite,
  walletAddress?: string
): DepositEarnService => {
  if (!walletAddress) {
    throw new Error('Wallet address not configured');
  }

  return new DepositEarnService(env, walletAddress);
};

/**
 * Utility function to execute a deposit operation
 * @param {onchainWrite | onchainRead} env - The onchain environment
 * @param {DepositParams} params - The deposit parameters
 * @returns {Promise<string>} JSON string containing the deposit result
 */
export const depositEarnPosition = async (
  env: onchainWrite,
  params: DepositParams
) => {
  const accountAddress = env.account?.address;
  try {
    const depositEarnService = createDepositEarnService(env, accountAddress);
    const result = await depositEarnService.depositEarnTransaction(params, env);
    return result;
  } catch (error) {
    // console.error('Detailed deposit error:', error);
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
