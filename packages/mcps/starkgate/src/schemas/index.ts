import { z } from 'zod';

/**
 * Schema for depositing tokens from L1 to L2
 */
export const depositSchema = z.object({
  token: z
    .enum(['ETH', 'USDC'])
    .describe('The token to deposit (ETH or USDC)'),
  amount: z.string().describe('The amount to deposit (in token units)'),
  l2RecipientAddress: z
    .string()
    .describe('The Starknet L2 address that will receive the tokens'),
  network: z
    .enum(['MAINNET', 'SEPOLIA'])
    .default('MAINNET')
    .describe('The network to use (MAINNET or SEPOLIA)'),
});

/**
 * Schema for withdrawing tokens from L2 to L1
 */
export const withdrawSchema = z.object({
  token: z
    .enum(['ETH', 'USDC'])
    .describe('The token to withdraw (ETH or USDC)'),
  amount: z.string().describe('The amount to withdraw (in token units)'),
  l1RecipientAddress: z
    .string()
    .describe('The Ethereum L1 address that will receive the tokens'),
  network: z
    .enum(['MAINNET', 'SEPOLIA'])
    .default('MAINNET')
    .describe('The network to use (MAINNET or SEPOLIA)'),
});
