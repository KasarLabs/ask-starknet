import { Account, Call } from 'starknet';
import { z } from 'zod';
import { parseUnits } from 'ethers';
import {
  Address,
  DepositParams,
  DepositResult,
  IBaseToken,
  IPool,
  IPoolAsset,
  ITokenValue,
  poolParser,
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
import { onchainWrite, toolResult } from '@kasarlabs/ask-starknet-core';

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
      .transform(({ data }) => data)
      .parse(data);
    const assets = await this.getPoolAssetsPriceAndRiskMdx(
      pool.id,
      pool.extensionContractAddress,
      pool.assets
    );

    return { ...pool, assets };
  }

  /**
   * Generates approval call for vToken operations
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
   * Executes a deposit transaction
   * @param {DepositParams} params - Deposit parameters
   * @param {onchainWrite | onchainRead} env - The onchain environment
   * @returns {Promise<DepositResult>} Result of the deposit operation
   */
  async depositEarnTransaction(
    params: DepositParams,
    env: onchainWrite
  ): Promise<toolResult> {
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
          params.depositTokenSymbol.toLocaleUpperCase()
      );

      if (!collateralPoolAsset) {
        throw new Error('Collateral asset not found in pool');
      }

      const collateralAmount = parseUnits(
        params.depositAmount,
        // 0
        collateralPoolAsset.decimals
      );

      const vtokenContract = getVTokenContract(
        collateralPoolAsset.vToken.address
      );

      const vTokenApproveCall = await this.approveVTokenCalls(
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

      return {
        status: 'success',
        data: {
          amount: params.depositAmount,
          symbol: params.depositTokenSymbol,
          recipients_address: account.address,
          transaction_hash: tx.transaction_hash,
        },
      };
    } catch (error) {
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
): Promise<toolResult> => {
  const accountAddress = env.account?.address;
  try {
    const depositEarnService = createDepositEarnService(env, accountAddress);
    const res = await depositEarnService.depositEarnTransaction(params, env);
    return res;
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
