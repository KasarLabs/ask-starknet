import { Account, CairoCustomEnum, Contract } from 'starknet';
import {
  RepayBorrowParams,
  RepayBorrowResult,
} from '../../interfaces/index.js';
import { GENESIS_POOLID } from '../../lib/constants/index.js';
import { toI257, toHex } from '../../lib/utils/num.js';
import type { Address } from '../../interfaces/index.js';
import { addressSchema } from '../../interfaces/index.js';
import {
  getPool,
  getExtensionContractAddress,
  getSingletonAddress,
} from '../../lib/utils/pools.js';
import { formatTokenAmount } from '../../lib/utils/tokens.js';
import {
  getPoolContract,
  getErc20Contract,
} from '../../lib/utils/contracts.js';
import { VESU_API_URL } from '../../lib/constants/index.js';
import { singletonAbi } from '../../lib/abis/singletonAbi.js';
import { z } from 'zod';
import { onchainWrite, toolResult } from '@kasarlabs/ask-starknet-core';
import { safeStringify } from '../../lib/utils/ekubo.js';

/**
 * Service for managing borrow repay operations
 */
export class RepayBorrowService {
  constructor(
    private env: onchainWrite,
    private walletAddress: string
  ) {}

  /**
   * Executes a borrow repay transaction (repay debt without withdrawing collateral)
   */
  async repayBorrowTransaction(
    params: RepayBorrowParams,
    env: onchainWrite
  ): Promise<RepayBorrowResult> {
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

      // For v2, we need to fetch position to get collateralShares.value
      // For v1, we only need to fetch if repayAmount is not provided
      let debtAmount: bigint;
      let collateralSharesValue: bigint | undefined;
      let decimalsToUse: number = 18;
      if (pool.protocolVersion === 'v2' || !params.repayAmount) {
        try {
          // Fetch positions from API
          const queryParams = new URLSearchParams();
          queryParams.append('walletAddress', account.address);
          queryParams.append('type', 'borrow');

          const response = await fetch(
            `${VESU_API_URL}/positions?${queryParams.toString()}`
          );

          if (!response.ok) {
            throw new Error(
              `API request failed with status ${response.status}`
            );
          }

          const data = await response.json();

          // Parse the response with a more permissive schema - we need debt info, nominalDebt and collateralShares for v2
          const positionsSchema = z.object({
            data: z.array(
              z
                .object({
                  type: z.string(),
                  pool: z.object({
                    id: z.string(),
                  }),
                  collateral: z
                    .object({
                      symbol: z.string(),
                    })
                    .optional(),
                  debt: z
                    .object({
                      symbol: z.string(),
                      value: z.string(),
                      decimals: z.number(),
                    })
                    .optional(),
                  nominalDebt: z
                    .object({
                      value: z.string(),
                      decimals: z.number(),
                    })
                    .optional(),
                  collateralShares: z
                    .object({
                      value: z.string(),
                    })
                    .optional(),
                })
                .passthrough()
            ), // passthrough allows extra fields
          });

          const parsedData = positionsSchema.parse(data);
          const positions = parsedData.data;

          // Find the position matching pool, collateral, and debt tokens
          const matchingPosition = positions.find((position: any) => {
            if (position.type !== 'borrow') return false;

            return (
              position.pool.id === poolId &&
              position.collateral?.symbol.toUpperCase() ===
                params.collateralTokenSymbol.toUpperCase() &&
              position.debt?.symbol.toUpperCase() ===
                params.debtTokenSymbol.toUpperCase()
            );
          });

          if (!matchingPosition) {
            throw new Error('No matching borrow position found');
          }

          // For v2, get collateralShares.value and nominalDebt.decimals
          if (pool.protocolVersion === 'v2') {
            if (
              !matchingPosition.collateralShares ||
              !matchingPosition.collateralShares.value
            ) {
              throw new Error('No collateralShares found in position');
            }
            collateralSharesValue = BigInt(
              matchingPosition.collateralShares.value
            );

            if (!matchingPosition.nominalDebt) {
              throw new Error('No nominalDebt found in position');
            }
            if (matchingPosition.nominalDebt.decimals === undefined) {
              throw new Error('No nominalDebt.decimals found in position');
            }
          }

          // If repayAmount is not provided, get the total debt amount from API

          if (!params.repayAmount) {
            if (pool.protocolVersion === 'v2') {
              // For v2, use nominalDebt.value
              if (
                !matchingPosition.nominalDebt ||
                !matchingPosition.nominalDebt.value ||
                !matchingPosition.nominalDebt.decimals
              ) {
                throw new Error('No nominalDebt found in position');
              }
              debtAmount = BigInt(matchingPosition.nominalDebt.value);
              decimalsToUse = matchingPosition.nominalDebt.decimals;
            } else {
              // For v1, use debt.value
              if (!matchingPosition.debt || !matchingPosition.debt.value) {
                throw new Error('No debt found in position');
              }
              // Use debt.value directly (it's already in the correct format with decimals)
              decimalsToUse = debtAsset.decimals;
              debtAmount = BigInt(matchingPosition.debt.value);
            }
          } else {
            // If repayAmount is provided, calculate from repayAmount
            // For v2, use nominalDebt.decimals; for v1, use debtAsset.decimals
            decimalsToUse = debtAsset.decimals;
            const formattedAmount = formatTokenAmount(
              params.repayAmount,
              decimalsToUse
            );
            debtAmount = BigInt(formattedAmount);
          }
        } catch (error) {
          throw new Error(
            `Failed to get position data: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      } else {
        // If repayAmount is provided and it's v1, calculate debtAmount from it
        decimalsToUse = debtAsset.decimals;
        const formattedAmount = formatTokenAmount(
          params.repayAmount,
          decimalsToUse
        );
        debtAmount = BigInt(formattedAmount);
      }

      if (debtAmount === 0n) {
        throw new Error('Repay amount must be greater than zero');
      }

      const MAX_U256 = 2n ** 256n - 1n;
      if (debtAmount > MAX_U256) {
        throw new Error('Amount exceeds maximum u256 limit');
      }

      // Approve debt token for repayment
      let debtTokenApproveCall;
      try {
        const approveToAddress =
          pool.protocolVersion === 'v2'
            ? extensionContractAddress
            : singletonAddress;
        if (!approveToAddress) {
          throw new Error('Approve address not available');
        }
        const tokenContract = getErc20Contract(debtAsset.address);
        const approveAmount = (debtAmount * 110n) / 100n;
        debtTokenApproveCall = tokenContract.populateTransaction.approve(
          approveToAddress,
          approveAmount
        );
      } catch (error) {
        throw new Error(
          `Failed to approve token: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }

      let modifyPositionParams: any;
      let contractForTx: any;

      if (pool.protocolVersion === 'v2') {
        if (collateralSharesValue === undefined) {
          throw new Error(
            'collateralShares.value is required for v2 but was not found'
          );
        }

        const typedPoolContract = getPoolContract(extensionContractAddress);
        const poolContract = new Contract(
          typedPoolContract.abi,
          extensionContractAddress,
          env.provider
        );

        contractForTx = poolContract;
        const assetsEnum = new CairoCustomEnum({ Assets: {} });
        const nativeEnum = new CairoCustomEnum({ Native: {} });

        modifyPositionParams = {
          collateral_asset: collateralAsset.address as `0x${string}`,
          debt_asset: debtAsset.address as `0x${string}`,
          user: account.address as `0x${string}`,
          collateral: {
            denomination: params.repayAmount ? assetsEnum : nativeEnum,
            value: params.repayAmount
              ? toI257(0n)
              : toI257(-collateralSharesValue), // Use collateralShares.value from API
          },
          debt: {
            denomination: params.repayAmount ? assetsEnum : nativeEnum,
            value: toI257(-debtAmount), // Negative for repayment
          },
        };
      } else {
        contractForTx = new Contract(
          singletonAbi,
          singletonAddress,
          env.provider
        );

        const deltaEnum = new CairoCustomEnum({ Delta: {} });
        const targetEnum = new CairoCustomEnum({ Target: {} });
        const assetsEnum = new CairoCustomEnum({ Assets: {} });

        modifyPositionParams = {
          pool_id: String(poolId),
          collateral_asset: collateralAsset.address,
          debt_asset: debtAsset.address,
          user: account.address,
          collateral: {
            amount_type: deltaEnum,
            denomination: assetsEnum,
            value: toI257(0n), // No collateral change
          },
          debt: {
            amount_type: params.repayAmount ? deltaEnum : targetEnum,
            denomination: assetsEnum,
            value: toI257(params.repayAmount ? -debtAmount : 0n), // Negative for repayment
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
          contractAddress: debtTokenApproveCall.contractAddress,
          entrypoint: debtTokenApproveCall.entrypoint,
          calldata: debtTokenApproveCall.calldata,
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

      // Convert debtAmount back to human-readable format for the result
      let repayAmountString: string;
      if (params.repayAmount) {
        repayAmountString = params.repayAmount;
      } else {
        const divisor = 10n ** BigInt(decimalsToUse);
        const wholePart = debtAmount / divisor;
        const fractionalPart = debtAmount % divisor;
        const fractionalStr = fractionalPart
          .toString()
          .padStart(decimalsToUse, '0')
          .replace(/0+$/, '');
        repayAmountString = fractionalStr
          ? `${wholePart}.${fractionalStr}`
          : wholePart.toString();
      }

      const result: RepayBorrowResult = {
        status: 'success',
        repayAmount: repayAmountString,
        collateralSymbol: params.collateralTokenSymbol,
        debtSymbol: params.debtTokenSymbol,
        recipient_address: account.address,
        transaction_hash: tx.transaction_hash,
      };

      return result;
    } catch (error) {
      return {
        status: 'failure',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Creates a new RepayBorrowService instance
 */
export const createRepayBorrowService = (
  env: onchainWrite,
  walletAddress?: string
): RepayBorrowService => {
  if (!walletAddress) {
    throw new Error('Wallet address not configured');
  }

  return new RepayBorrowService(env, walletAddress);
};

/**
 * Executes a borrow repay operation
 */
export const repayBorrowPosition = async (
  env: onchainWrite,
  params: RepayBorrowParams
): Promise<toolResult> => {
  const accountAddress = env.account?.address;
  try {
    const repayBorrowService = createRepayBorrowService(env, accountAddress);
    const result = await repayBorrowService.repayBorrowTransaction(params, env);

    if (result.status === 'success') {
      return {
        status: 'success',
        data: {
          repayAmount: result.repayAmount,
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
