import { z } from 'zod';

// Schema for depositing into a chamber
export const depositToChamberSchema = z.object({
  tokenAddress: z
    .string()
    .describe('The address of the ERC20 token to deposit'),
  amount: z
    .string()
    .describe(
      'The amount to deposit (in token units, e.g., "1000000" for 1 USDC with 6 decimals)'
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
  tokenAddress: z.string().describe('The address of the token to withdraw'),
  amount: z
    .string()
    .describe('The amount to withdraw (must match the deposited amount)'),
});

export type WithdrawFromChamberParams = z.infer<
  typeof withdrawFromChamberSchema
>;
