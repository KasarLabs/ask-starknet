import { z } from 'zod';

export const depositEarnSchema = z.object({
  depositTokenSymbol: z
    .string()
    .describe("Symbol of the token to deposit (e.g., 'ETH', 'USDC')"),
  depositAmount: z
    .string()
    .describe(
      'The amount to swap (in token decimals, e.g., "1000000" for 1 USDC with 6 decimals)'
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
});

export type GetSchemaType = z.infer<typeof getSchema>;
