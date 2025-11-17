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
  pool_id: z
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
  pool_id: z
    .string()
    .optional()
    .describe('Optional pool ID. If not provided, GENESIS_POOLID will be used'),
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
  pool_name: z
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
