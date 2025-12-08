import { z } from 'zod';

// Supported token symbols for Mist Cash (using Starknet token addresses)
export const mistCashSupportedSymbols = z.enum([
  'ETH',
  'STRK',
  'USDC',
  'USDT',
  'WBTC',
  'SWSS',
]);

export type MistCashTokenSymbol = z.infer<typeof mistCashSupportedSymbols>;

// Schema for depositing into a chamber
export const depositToChamberSchema = z.object({
  symbol: mistCashSupportedSymbols.describe(
    'The token symbol to deposit (e.g., ETH, USDC, STRK)'
  ),
  amount: z
    .string()
    .describe(
      'The amount to deposit in standard units (e.g., "1" for 1 USDC, "0.5" for 0.5 ETH)'
    ),
  claimingKey: z
    .string()
    .optional()
    .describe(
      'Optional claiming key. If not provided, a random one will be generated'
    ),
  recipientAddress: z
    .string()
    .describe('The address that will be able to withdraw the funds'),
});

export type DepositToChamberParams = z.infer<typeof depositToChamberSchema>;

// Schema for checking chamber info for an address
export const getChamberInfoSchema = z.object({
  claimingKey: z.string().describe('The claiming key used during deposit'),
  recipientAddress: z
    .string()
    .describe('The recipient address that can withdraw'),
});

export type GetChamberInfoParams = z.infer<typeof getChamberInfoSchema>;

// Schema for withdrawing from a chamber
export const withdrawFromChamberSchema = z.object({
  claimingKey: z.string().describe('The claiming key used during deposit'),
  recipientAddress: z
    .string()
    .describe('The recipient address that will receive the funds'),
  symbol: mistCashSupportedSymbols.describe(
    'The token symbol to withdraw (e.g., ETH, USDC, STRK)'
  ),
  amount: z
    .string()
    .describe(
      'The amount to withdraw in standard units (e.g., "1" for 1 USDC, "0.5" for 0.5 ETH)'
    ),
});

export type WithdrawFromChamberParams = z.infer<
  typeof withdrawFromChamberSchema
>;
