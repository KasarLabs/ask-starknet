import { z } from 'zod';
import { addressSchema } from '../interfaces/index.js';

export const depositEarnSchema = z.object({
  depositTokenSymbol: z
    .string()
    .describe("Symbol of the token to deposit (e.g., 'ETH', 'USDC')"),
  depositAmount: z
    .string()
    .describe(
      'The amount to deposit in human decimal format (e.g., "1.5" for 1.5 tokens, "0.0001" for 0.0001 tokens)'
    ),
  poolId: z
    .string()
    .optional()
    .describe('Optional pool ID. If not provided, GENESIS_POOLID will be used'),
});

export const withdrawEarnSchema = z.object({
  withdrawTokenSymbol: z
    .string()
    .describe("Symbol of the token to withdraw (e.g., 'ETH', 'USDC')"),
  withdrawAmount: z
    .string()
    .optional()
    .describe(
      'Optional amount to withdraw in human decimal format (e.g., "1.5" for 1.5 tokens). If "0" or not provided, withdraws all available tokens'
    ),
  poolId: z
    .string()
    .optional()
    .describe('Optional pool ID. If not provided, GENESIS_POOLID will be used'),
});

export const depositMultiplySchema = z.object({
  collateralTokenSymbol: z
    .string()
    .describe(
      "Symbol of the collateral token to deposit (e.g., 'ETH', 'USDC')"
    ),
  debtTokenSymbol: z
    .string()
    .describe("Symbol of the debt token to borrow (e.g., 'ETH', 'USDC')"),
  depositAmount: z
    .string()
    .describe(
      'Amount of collateral to deposit in human decimal format (e.g., "1.5" for 1.5 tokens)'
    ),
  targetLTV: z
    .string()
    .optional()
    .describe(
      'Optional target LTV (Loan-to-Value) ratio as a percentage (e.g., "75" for 75%). If not provided, will use maximum LTV'
    ),
  poolId: z
    .string()
    .optional()
    .describe('Optional pool ID. If not provided, GENESIS_POOLID will be used'),
  ekuboFee: z
    .number()
    .optional()
    .default(0.05)
    .describe(
      'Optional Ekubo pool fee tier as a percentage (e.g., 0.05 for 0.05%, 0.3 for 0.3%, 1 for 1%, defaults to 0.05)'
    ),
  ekuboTickSpacing: z
    .number()
    .optional()
    .default(0.1)
    .describe(
      'Optional Ekubo pool tick spacing as a percentage (e.g., 0.01 for 0.01%, 0.1 for 0.1%, 1 for 1%, defaults to 0.1)'
    ),
  ekuboExtension: z
    .string()
    .optional()
    .default('0x0')
    .describe(
      'Optional Ekubo pool extension contract address (default: "0x0")'
    ),
  ekuboSlippage: z
    .number()
    .optional()
    .default(50)
    .describe(
      'Optional slippage tolerance in basis points (e.g., 50 for 0.5%, 100 for 1%, defaults to 50 for 0.5%)'
    ),
});

export const withdrawMultiplySchema = z.object({
  collateralTokenSymbol: z
    .string()
    .describe(
      "Symbol of the collateral token to withdraw (e.g., 'ETH', 'USDC')"
    ),
  debtTokenSymbol: z
    .string()
    .describe("Symbol of the debt token to repay (e.g., 'ETH', 'USDC')"),
  withdrawAmount: z
    .string()
    .optional()
    .describe(
      'Optional amount of collateral to withdraw in human decimal format (e.g., "1.5" for 1.5 tokens). If "0" or not provided, closes the entire position'
    ),
  poolId: z
    .string()
    .optional()
    .describe('Optional pool ID. If not provided, GENESIS_POOLID will be used'),
  ekuboFee: z
    .number()
    .optional()
    .default(0.05)
    .describe(
      'Optional Ekubo pool fee tier as a percentage (e.g., 0.05 for 0.05%, 0.3 for 0.3%, 1 for 1%, defaults to 0.05)'
    ),
  ekuboTickSpacing: z
    .number()
    .optional()
    .default(0.1)
    .describe(
      'Optional Ekubo pool tick spacing as a percentage (e.g., 0.01 for 0.01%, 0.1 for 0.1%, 1 for 1%, defaults to 0.1)'
    ),
  ekuboExtension: z
    .string()
    .optional()
    .default('0x0')
    .describe(
      'Optional Ekubo pool extension contract address (default: "0x0")'
    ),
  ekuboSlippage: z
    .number()
    .optional()
    .default(50)
    .describe(
      'Optional slippage tolerance in basis points (e.g., 50 for 0.5%, 100 for 1%, defaults to 50 for 0.5%)'
    ),
});

export const depositBorrowSchema = z.object({
  collateralTokenSymbol: z
    .string()
    .describe(
      "Symbol of the collateral token to deposit (e.g., 'ETH', 'USDC')"
    ),
  debtTokenSymbol: z
    .string()
    .describe("Symbol of the debt token to borrow (e.g., 'ETH', 'USDC')"),
  depositAmount: z
    .string()
    .describe(
      'Amount of collateral to deposit in human decimal format (e.g., "1.5" for 1.5 tokens)'
    ),
  targetLTV: z
    .string()
    .optional()
    .describe(
      'Optional target LTV (Loan-to-Value) ratio as a percentage (e.g., "75" for 75%). If not provided, will use maximum LTV'
    ),
  poolId: z
    .string()
    .optional()
    .describe('Optional pool ID. If not provided, GENESIS_POOLID will be used'),
});

export const repayBorrowSchema = z.object({
  collateralTokenSymbol: z
    .string()
    .describe("Symbol of the collateral token (e.g., 'ETH', 'USDC')"),
  debtTokenSymbol: z
    .string()
    .describe("Symbol of the debt token to repay (e.g., 'ETH', 'USDC')"),
  repayAmount: z
    .string()
    .optional()
    .describe(
      'Optional amount of debt to repay in human decimal format (e.g., "1.5" for 1.5 tokens). If not provided, repays all debt'
    ),
  poolId: z
    .string()
    .optional()
    .describe('Optional pool ID. If not provided, GENESIS_POOLID will be used'),
});

export const updateMultiplySchema = z.object({
  collateralTokenSymbol: z
    .string()
    .describe(
      "Symbol of the collateral token in the position (e.g., 'ETH', 'USDC')"
    ),
  debtTokenSymbol: z
    .string()
    .describe("Symbol of the debt token in the position (e.g., 'ETH', 'USDC')"),
  targetLTV: z
    .string()
    .describe(
      'Target LTV (Loan-to-Value) ratio as a percentage (e.g., "75" for 75%). This is mandatory and will update the position to this LTV'
    ),
  poolId: z
    .string()
    .optional()
    .describe('Optional pool ID. If not provided, GENESIS_POOLID will be used'),
  ekuboFee: z
    .number()
    .optional()
    .default(0.05)
    .describe(
      'Optional Ekubo pool fee tier as a percentage (e.g., 0.05 for 0.05%, 0.3 for 0.3%, 1 for 1%, defaults to 0.05)'
    ),
  ekuboTickSpacing: z
    .number()
    .optional()
    .default(0.1)
    .describe(
      'Optional Ekubo pool tick spacing as a percentage (e.g., 0.01 for 0.01%, 0.1 for 0.1%, 1 for 1%, defaults to 0.1)'
    ),
  ekuboExtension: z
    .string()
    .optional()
    .default('0x0')
    .describe(
      'Optional Ekubo pool extension contract address (default: "0x0")'
    ),
  ekuboSlippage: z
    .number()
    .optional()
    .default(50)
    .describe(
      'Optional slippage tolerance in basis points (e.g., 50 for 0.5%, 100 for 1%, defaults to 50 for 0.5%)'
    ),
});

export const getSchema = z.object({
  onlyVerified: z
    .boolean()
    .default(true)
    .describe('Filter to only show verified pools'),
  onlyEnabledAssets: z
    .boolean()
    .default(true)
    .describe('Filter to only show pools with enabled assets'),
  poolId: z
    .string()
    .optional()
    .describe('Optional pool ID to fetch a specific pool'),
  poolName: z
    .string()
    .optional()
    .describe('Optional pool name to filter pools by name'),
});

export type GetSchemaType = z.infer<typeof getSchema>;

export const getPositionsSchema = z.object({
  walletAddress: addressSchema.describe(
    'Wallet address to fetch positions for'
  ),
  type: z
    .array(z.enum(['earn', 'borrow', 'multiply']))
    .optional()
    .describe(
      'Optional array of position types to filter (earn, borrow, multiply)'
    ),
  maxHealthFactor: z
    .string()
    .optional()
    .describe(
      'Optional filter to return positions with health factor less than or equal to this value'
    ),
  hasRebalancingEnabled: z
    .boolean()
    .optional()
    .describe(
      'Optional filter to return positions that have rebalancing enabled or not'
    ),
});

export type GetPositionsSchemaType = z.infer<typeof getPositionsSchema>;

export const getTokensSchema = z.object({
  address: addressSchema
    .optional()
    .describe(
      'Optional token address to check if a specific token is supported'
    ),
  symbol: z
    .string()
    .optional()
    .describe(
      "Optional token symbol to check if a specific token is supported (e.g., 'ETH', 'USDC')"
    ),
});

export type GetTokensSchemaType = z.infer<typeof getTokensSchema>;
