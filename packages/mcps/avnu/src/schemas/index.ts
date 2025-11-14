import z from 'zod';

export const swapSchema = z
  .object({
    sellTokenSymbol: z
      .string()
      .optional()
      .describe(
        "Symbol of the token to sell (e.g., 'ETH', 'USDC'). Either symbol or address must be provided."
      ),
    sellTokenAddress: z
      .string()
      .optional()
      .describe(
        'Address of the token to sell. Either symbol or address must be provided.'
      ),
    buyTokenSymbol: z
      .string()
      .optional()
      .describe(
        "Symbol of the token to buy (e.g., 'ETH', 'USDC'). Either symbol or address must be provided."
      ),
    buyTokenAddress: z
      .string()
      .optional()
      .describe(
        'Address of the token to buy. Either symbol or address must be provided.'
      ),
    sellAmount: z.number().min(0.000001).describe('Amount of tokens to sell'),
  })
  .refine((data) => data.sellTokenSymbol || data.sellTokenAddress, {
    message: 'Either sellTokenSymbol or sellTokenAddress must be provided',
    path: ['sellTokenSymbol'],
  })
  .refine((data) => data.buyTokenSymbol || data.buyTokenAddress, {
    message: 'Either buyTokenSymbol or buyTokenAddress must be provided',
    path: ['buyTokenSymbol'],
  });

export const routeSchema = z
  .object({
    sellTokenSymbol: z
      .string()
      .optional()
      .describe(
        "Symbol of the token to sell (e.g., 'ETH', 'USDC'). Either symbol or address must be provided."
      ),
    sellTokenAddress: z
      .string()
      .optional()
      .describe(
        'Address of the token to sell. Either symbol or address must be provided.'
      ),
    buyTokenSymbol: z
      .string()
      .optional()
      .describe(
        "Symbol of the token to buy (e.g., 'ETH', 'USDC'). Either symbol or address must be provided."
      ),
    buyTokenAddress: z
      .string()
      .optional()
      .describe(
        'Address of the token to buy. Either symbol or address must be provided.'
      ),
    sellAmount: z.number().min(0.000001).describe('Amount of tokens to sell'),
  })
  .refine((data) => data.sellTokenSymbol || data.sellTokenAddress, {
    message: 'Either sellTokenSymbol or sellTokenAddress must be provided',
    path: ['sellTokenSymbol'],
  })
  .refine((data) => data.buyTokenSymbol || data.buyTokenAddress, {
    message: 'Either buyTokenSymbol or buyTokenAddress must be provided',
    path: ['buyTokenSymbol'],
  });

export type RouteSchemaType = z.infer<typeof routeSchema>;
export type SwapSchemaType = z.infer<typeof swapSchema>;
