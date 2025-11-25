import { z } from 'zod';

export const bridgeL1toL2Schema = z.object({
  toAddress: z.string().describe('The Starknet address to receive the funds'),
  amount: z
    .string()
    .describe('The amount of ETH to bridge (in ETH units, e.g., "0.001")'),
  tokenAddress: z
    .string()
    .optional()
    .describe(
      'The token address to withdraw, by default is the chain native token(ETH for ehtereum, BTC for bitcoin , SOL for solana)'
    ),
  message: z
    .string()
    .max(256)
    .optional()
    .describe(
      'An optional message to include with the bridge transaction maximum 256 characters'
    ),
});

export const bridgeL2toL1Schema = z.object({
  toAddress: z.string().describe('The Ethereum address to receive the funds'),
  amount: z
    .string()
    .describe('The amount of ETH to withdraw (in ETH units, e.g., "0.001")'),
  tokenAddress: z
    .string()
    .optional()
    .describe(
      'The token address to withdraw, by default is the STRK chain native token)'
    ),
});

export type BridgeL1toL2Params = z.infer<typeof bridgeL1toL2Schema>;
export type BridgeL2toL1Params = z.infer<typeof bridgeL2toL1Schema>;
