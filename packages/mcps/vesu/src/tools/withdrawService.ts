import { Account, Call } from 'starknet';
import { logger, SnakAgentInterface } from '../lib/dependances/types.js';
import { z } from 'zod';
import {
  Address,
  WithdrawParams,
  IBaseToken,
  IPool,
  IPoolAsset,
  ITokenValue,
  poolParser,
  WithdrawResult,
} from '../interfaces/index.js';
import {
  DEFAULT_DECIMALS,
  GENESIS_POOLID,
  VESU_API_URL,
} from '../lib/constants/index.js';
import { Hex, toBN, toU256 } from '../lib/utils/num.js';
import {
  getErc20Contract,
  getExtensionContract,
  getVTokenContract,
} from '../lib/utils/contracts.js';
import { onchainWrite } from '@snaknet/core';

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
   * Retrieves token price from the pool extension contract
   * @param {IBaseToken} token - The token to get price for
   * @param {string} poolId - The pool identifier
   * @param {Hex} poolExtension - The pool extension contract address
   * @returns {Promise<ITokenValue | undefined>} Token price information if available
   */
  public async getTokenPrice(
    token: IBaseToken,
    poolId: string,
    poolExtension: Hex
  ): Promise<ITokenValue | undefined> {
    const contract = getExtensionContract(poolExtension);

    try {
      const res = await contract.price(poolId, token.address);
      return res.is_valid && res.value
        ? { value: toBN(res.value), decimals: DEFAULT_DECIMALS }
        : undefined;
    } catch (err) {
      // logger.error('error', err);
      return undefined;
    }
  }

  /**
   * Retrieves and updates pool assets with prices and risk metrics
   * @private
   * @param {IPool['id']} poolId - Pool identifier
   * @param {IPool['extensionContractAddress']} poolExtensionContractAddress - Extension contract address
   * @param {IPoolAsset[]} poolAssets - Array of pool assets
   * @returns {Promise<IPoolAsset[]>} Updated pool assets with prices and risk metrics
   */
  private async getPoolAssetsPriceAndRiskMdx(
    poolId: IPool['id'],
    poolExtensionContractAddress: IPool['extensionContractAddress'],
    poolAssets: IPoolAsset[]
  ): Promise<IPoolAsset[]> {
    return await Promise.all(
      poolAssets.map(async (asset) => {
        const usdPrice = await this.getTokenPrice(
          asset,
          poolId,
          poolExtensionContractAddress
        );

        return {
          ...asset,
          risk: null,
          usdPrice,
        };
      })
    );
  }

  /**
   * Retrieves pool information and updates assets with prices
   * @param {string} poolId - Pool identifier
   * @returns {Promise<IPool>} Updated pool information
   */
  public async getPool(poolId: string): Promise<IPool> {
    const data = await fetch(`${VESU_API_URL}/pools/${poolId}`).then((res) =>
      res.json()
    );
    const pool = z
      .object({ data: poolParser })
      .transform(({ data }) => data as IPool)
      .parse(data);
    const assets = await this.getPoolAssetsPriceAndRiskMdx(
      pool.id,
      pool.extensionContractAddress,
      pool.assets
    );

    return { ...pool, assets };
  }

  /**
   * Retrieves token balance for a given wallet address
   * @param {IBaseToken} baseToken - The token to check balance for
   * @param {Hex} walletAddress - The wallet address to check
   * @returns {Promise<bigint>} Token balance
   */
  async getTokenBalance(
    baseToken: IBaseToken,
    walletAddress: Hex
  ): Promise<bigint> {
    const tokenContract = getErc20Contract(baseToken.address);

    return await tokenContract
      .balanceOf(walletAddress)
      .then(toBN)
      .catch(() => {
        console.error(
          new Error(`Failed to get balance of ${baseToken.address}`)
        );
        return 0n;
      });
  }

  /**
   * Generates approval calls for vToken operations
   * @param {Address} assetAddress - Address of the asset to approve
   * @param {Address} vTokenAddress - Address of the vToken
   * @param {bigint} amount - Amount to approve
   * @returns {Promise<Call>} Approval transaction call
   */
  async approveVTokenCalls(
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
      const pool = await this.getPool(GENESIS_POOLID);

      const collateralPoolAsset = pool.assets.find(
        (a) =>
          a.symbol.toLocaleUpperCase() ===
          params.withdrawTokenSymbol.toLocaleUpperCase()
      );

      if (!collateralPoolAsset) {
        throw new Error('Collateral asset not found in pool');
      }
      // logger.info(
      //   'collateralPoolAsset.decimals===',
      //   collateralPoolAsset.decimals
      // );

      const vtokenContract = getVTokenContract(
        collateralPoolAsset.vToken.address
      );

      const vTokenShares = await this.getTokenBalance(
        collateralPoolAsset.vToken,
        account.address as Hex
      );

      const credentials = env.account;
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

      // logger.info('approval initiated. Transaction hash:', tx.transaction_hash);
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
