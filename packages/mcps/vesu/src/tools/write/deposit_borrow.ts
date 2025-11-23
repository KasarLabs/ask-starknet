import { Account, CairoCustomEnum, Contract } from 'starknet';
import {
  DepositBorrowParams,
  DepositBorrowResult,
} from '../../interfaces/index.js';
import { GENESIS_POOLID } from '../../lib/constants/index.js';
import { Hex, toU256, toI257, toBN, toHex } from '../../lib/utils/num.js';
import type { Address } from '../../interfaces/index.js';
import { addressSchema } from '../../interfaces/index.js';
import {
  getPool,
  getExtensionContractAddress,
  getSingletonAddress,
} from '../../lib/utils/pools.js';
import { formatTokenAmount } from '../../lib/utils/tokens.js';
import {
  getSingletonContract,
  getExtensionContract,
  getPoolContract,
  getErc20Contract,
} from '../../lib/utils/contracts.js';
import { onchainWrite, toolResult } from '@kasarlabs/ask-starknet-core';

/**
 * Service for managing borrow deposit operations
 */
export class DepositBorrowService {
  constructor(
    private env: onchainWrite,
    private walletAddress: string
  ) {}

  /**
   * Executes a borrow deposit transaction
   */
  async depositBorrowTransaction(
    params: DepositBorrowParams,
    env: onchainWrite
  ): Promise<DepositBorrowResult> {
    try {
      const account = new Account(
        this.env.provider,
        this.walletAddress,
        this.env.account.signer
      );
      const poolId = String(params.poolId || GENESIS_POOLID);

      let pool: any;
      try {
        pool = await getPool(poolId);
      } catch (error) {
        throw new Error(
          `Failed to get pool: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }

      const extensionContractAddressRaw = getExtensionContractAddress(pool);
      if (!extensionContractAddressRaw) {
        throw new Error('Pool extension contract address not available');
      }
      // Validate and normalize the address using addressSchema
      // For v1: extensionContractAddress is already a Hex address
      // For v2: pool.id should be a valid hex address
      const extensionContractAddressParse = addressSchema.safeParse(
        extensionContractAddressRaw
      );
      if (!extensionContractAddressParse.success) {
        throw new Error(
          `Invalid extension contract address: ${extensionContractAddressRaw}. ${extensionContractAddressParse.error.message}`
        );
      }
      const extensionContractAddress = extensionContractAddressParse.data;

      let singletonAddress: Address;
      try {
        const singletonAddressRaw = await getSingletonAddress(pool);
        if (!singletonAddressRaw) {
          throw new Error('Singleton address not available');
        }
        // Convert to hex string if it's a bigint (for v1 pools)
        const singletonAddressHex =
          typeof singletonAddressRaw === 'bigint'
            ? toHex(singletonAddressRaw)
            : singletonAddressRaw;
        // Validate and normalize the singleton address
        const singletonAddressParse =
          addressSchema.safeParse(singletonAddressHex);
        if (!singletonAddressParse.success) {
          throw new Error(
            `Invalid singleton address: ${singletonAddressHex}. ${singletonAddressParse.error.message}`
          );
        }
        singletonAddress = singletonAddressParse.data;
      } catch (error) {
        throw new Error(
          `Failed to get singleton address: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }

      const extensionContract = getExtensionContract(extensionContractAddress);

      const collateralAsset = pool.assets.find(
        (a: any) =>
          a.symbol.toUpperCase() === params.collateralTokenSymbol.toUpperCase()
      );

      const debtAsset = pool.assets.find(
        (a: any) =>
          a.symbol.toUpperCase() === params.debtTokenSymbol.toUpperCase()
      );

      if (!collateralAsset) {
        throw new Error('Collateral asset not found in pool');
      }

      if (!debtAsset) {
        throw new Error('Debt asset not found in pool');
      }

      const formattedAmount = formatTokenAmount(
        params.depositAmount,
        collateralAsset.decimals
      );
      const collateralAmount = BigInt(formattedAmount);

      let maxLTVValue: bigint;
      let singletonContract: any = null;

      if (pool.protocolVersion === 'v2') {
        const poolContract = getPoolContract(extensionContractAddress);

        let pairConfig;
        try {
          pairConfig = await poolContract.pair_config(
            collateralAsset.address as `0x${string}`,
            debtAsset.address as `0x${string}`
          );
        } catch (error) {
          throw new Error(
            `Failed to get pair config: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }

        maxLTVValue = toBN(pairConfig.max_ltv);
      } else {
        singletonContract = getSingletonContract(singletonAddress);

        let ltvConfig;
        try {
          ltvConfig = await singletonContract.ltv_config(
            poolId as `0x${string}`,
            collateralAsset.address as `0x${string}`,
            debtAsset.address as `0x${string}`
          );
        } catch (error) {
          throw new Error(
            `Failed to get LTV config: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }

        maxLTVValue = toBN(ltvConfig.max_ltv);
      }

      let targetLTVValue: bigint;
      if (params.targetLTV) {
        const ltvPercent = BigInt(params.targetLTV);
        if (ltvPercent >= 100n || ltvPercent < 0n) {
          throw new Error('Target LTV must be between 0 and 99');
        }
        targetLTVValue = ltvPercent * 100n;

        if (targetLTVValue > maxLTVValue) {
          const maxLTVPercent = Number(maxLTVValue) / 100;
          throw new Error(
            `Target LTV (${params.targetLTV}%) exceeds maximum LTV (${maxLTVPercent}%)`
          );
        }
      } else {
        targetLTVValue = maxLTVValue;
      }

      let collateralPrice: any;
      let debtPrice: any;

      if (pool.protocolVersion === 'v2') {
        const poolContract = getPoolContract(extensionContractAddress);

        try {
          collateralPrice = await poolContract.price(
            collateralAsset.address as `0x${string}`
          );
        } catch (error) {
          throw new Error(
            `Failed to get collateral price: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }

        try {
          debtPrice = await poolContract.price(
            debtAsset.address as `0x${string}`
          );
        } catch (error) {
          throw new Error(
            `Failed to get debt price: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      } else {
        try {
          collateralPrice = await extensionContract.price(
            poolId,
            collateralAsset.address
          );
        } catch (error) {
          throw new Error(
            `Failed to get collateral price: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }

        try {
          debtPrice = await extensionContract.price(poolId, debtAsset.address);
        } catch (error) {
          throw new Error(
            `Failed to get debt price: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      if (!collateralPrice.is_valid || !debtPrice.is_valid) {
        throw new Error('Invalid price data for assets');
      }

      const collateralPriceBN = toBN(collateralPrice.value);
      const debtPriceBN = toBN(debtPrice.value);

      const collateralValueUSD =
        (collateralAmount * collateralPriceBN) /
        10n ** BigInt(collateralAsset.decimals);

      // Apply safety margin (0.1%) to target LTV for additional protection
      // This reduces risk of immediate liquidation due to price fluctuations
      const safetyMargin = 999n;
      const adjustedLTV = (targetLTVValue * safetyMargin) / 1000n;

      // Simple loan formula: debt = collateral * LTV / 100
      // This is a direct loan without leverage effect
      const debtValueUSD = (collateralValueUSD * adjustedLTV) / 10000n;

      const debtAmountRaw =
        (debtValueUSD * 10n ** BigInt(debtAsset.decimals)) / debtPriceBN;
      const debtAmount = debtAmountRaw > 0n ? debtAmountRaw : 0n;

      if (debtAmount === 0n) {
        throw new Error('Calculated debt amount is zero');
      }

      const MAX_U256 = 2n ** 256n - 1n;
      if (debtAmount > MAX_U256 || collateralAmount > MAX_U256) {
        throw new Error('Amount exceeds maximum u256 limit');
      }

      let collateralVTokenApproveCall;
      try {
        const approveToAddress =
          pool.protocolVersion === 'v2'
            ? extensionContractAddress
            : singletonAddress;
        if (!approveToAddress) {
          throw new Error('Approve address not available');
        }
        const tokenContract = getErc20Contract(collateralAsset.address);
        collateralVTokenApproveCall =
          await tokenContract.populateTransaction.approve(
            approveToAddress,
            collateralAmount
          );
      } catch (error) {
        throw new Error(
          `Failed to approve token: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }

      let modifyPositionParams: any;
      let contractForTx: any;

      if (pool.protocolVersion === 'v2') {
        const typedPoolContract = getPoolContract(extensionContractAddress);
        const poolContract = new Contract(
          typedPoolContract.abi,
          extensionContractAddress,
          env.provider
        );

        contractForTx = poolContract;
        const assetsEnum = new CairoCustomEnum({ Assets: {} });

        modifyPositionParams = {
          collateral_asset: collateralAsset.address as `0x${string}`,
          debt_asset: debtAsset.address as `0x${string}`,
          user: account.address as `0x${string}`,
          collateral: {
            denomination: assetsEnum,
            value: toI257(collateralAmount),
          },
          debt: {
            denomination: assetsEnum,
            value: toI257(debtAmount),
          },
        };
      } else {
        if (!singletonContract) {
          singletonContract = getSingletonContract(singletonAddress);
        }

        contractForTx = new Contract(
          singletonContract.abi,
          singletonAddress,
          env.provider
        );

        const deltaEnum = new CairoCustomEnum({ Delta: {} });
        const assetsEnum = new CairoCustomEnum({ Assets: {} });

        modifyPositionParams = {
          pool_id: String(poolId),
          collateral_asset: collateralAsset.address,
          debt_asset: debtAsset.address,
          user: account.address,
          collateral: {
            amount_type: deltaEnum,
            denomination: assetsEnum,
            value: toI257(collateralAmount),
          },
          debt: {
            amount_type: deltaEnum,
            denomination: assetsEnum,
            value: toI257(debtAmount),
          },
          data: [],
        };
      }

      let modifyPositionCall;
      try {
        modifyPositionCall =
          await contractForTx.populateTransaction.modify_position(
            modifyPositionParams
          );
      } catch (error) {
        throw new Error(
          `Failed to populate modify_position transaction: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }

      const provider = env.provider;
      const wallet = env.account;

      const calls = [
        {
          contractAddress: collateralVTokenApproveCall.contractAddress,
          entrypoint: collateralVTokenApproveCall.entrypoint,
          calldata: collateralVTokenApproveCall.calldata,
        },
        {
          contractAddress: modifyPositionCall.contractAddress,
          entrypoint: modifyPositionCall.entrypoint,
          calldata: modifyPositionCall.calldata,
        },
      ];

      let tx;
      try {
        tx = await wallet.execute(calls);
      } catch (error) {
        throw new Error(
          `Failed to execute transaction: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }

      try {
        await provider.waitForTransaction(tx.transaction_hash);
      } catch (error) {
        throw new Error(
          `Failed to wait for transaction: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }

      const result: DepositBorrowResult = {
        status: 'success',
        amount: params.depositAmount,
        collateralSymbol: params.collateralTokenSymbol,
        debtSymbol: params.debtTokenSymbol,
        recipient_address: account.address,
        transaction_hash: tx.transaction_hash,
      };

      return result;
    } catch (error) {
      console.error('Deposit borrow error:', error);
      return {
        status: 'failure',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Creates a new DepositBorrowService instance
 */
export const createDepositBorrowService = (
  env: onchainWrite,
  walletAddress?: string
): DepositBorrowService => {
  if (!walletAddress) {
    throw new Error('Wallet address not configured');
  }

  return new DepositBorrowService(env, walletAddress);
};

/**
 * Executes a borrow deposit operation
 */
export const depositBorrowPosition = async (
  env: onchainWrite,
  params: DepositBorrowParams
): Promise<toolResult> => {
  const accountAddress = env.account?.address;
  try {
    const depositBorrowService = createDepositBorrowService(
      env,
      accountAddress
    );
    const result = await depositBorrowService.depositBorrowTransaction(
      params,
      env
    );

    if (result.status === 'success') {
      return {
        status: 'success',
        data: {
          amount: result.amount,
          collateralSymbol: result.collateralSymbol,
          debtSymbol: result.debtSymbol,
          recipient_address: result.recipient_address,
          transaction_hash: result.transaction_hash,
        },
      };
    } else {
      return {
        status: 'failure',
        error: result.error || 'Unknown error',
      };
    }
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
