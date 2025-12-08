import { z } from 'zod';

export const bridgeSupportedSymbols = z.enum([
  'ETH',
  'STRK',
  'USDC',
  'USDT',
  'WBTC',
  'SWSS',
]);
export const bridgeL1toL2Schema = z.object({
  toAddress: z.string().describe('The Starknet address to receive the funds'),
  amount: z
    .string()
    .describe('The amount of ETH to bridge (in ETH units, e.g., "0.001")'),
  symbol: bridgeSupportedSymbols.describe('The token symbol to bridge'),
});

export const bridgeL2toL1Schema = z.object({
  toAddress: z.string().describe('The Ethereum address to receive the funds'),
  amount: z
    .string()
    .describe('The amount of tokens to withdraw (in ETH units, e.g., "0.001")'),
  symbol: bridgeSupportedSymbols.describe('The token symbol to withdraw'),
});

export type BridgeL1toL2Params = z.infer<typeof bridgeL1toL2Schema>;
export type BridgeL2toL1Params = z.infer<typeof bridgeL2toL1Schema>;
