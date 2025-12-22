import z from 'zod';

export const swapSchema = z.object({
  sellTokenSymbol: z
    .string()
    .describe("Symbol of the token to sell (e.g., 'ETH', 'USDC')"),
  buyTokenSymbol: z
    .string()
    .describe("Symbol of the token to buy (e.g., 'ETH', 'USDC')"),
  sellAmount: z.number().min(0.000001).describe('Amount of tokens to sell'),
  slippage: z
    .number()
    .min(0)
    .max(100)
    .default(1)
    .describe('Slippage tolerance in percentage (default: 1)'),
});

export const batchSwapSchema = z.object({
  sellTokenSymbols: z.array(z.string()).describe('Symbols of tokens to sell'),
  buyTokenSymbols: z.array(z.string()).describe('Symbols of tokens to buy'),
  sellAmounts: z.array(z.number()).describe('Amounts of tokens to sell'),
  slippage: z
    .number()
    .min(0)
    .max(100)
    .default(1)
    .describe('Slippage tolerance in percentage (default: 1)'),
});

export const routeSchema = z.object({
  sellTokenSymbol: z
    .string()
    .describe("Symbol of the token to sell (e.g., 'ETH', 'USDC')"),
  buyTokenSymbol: z
    .string()
    .describe("Symbol of the token to buy (e.g., 'ETH', 'USDC')"),
  sellAmount: z.number().min(0.000001).describe('Amount of tokens to sell'),
});

export type RouteSchemaType = z.infer<typeof routeSchema>;
