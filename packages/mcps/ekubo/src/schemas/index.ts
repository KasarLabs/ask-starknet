import { z } from 'zod';

export const poolKeySchema = z
  .object({
    token0_symbol: z
      .string()
      .optional()
      .describe('The symbol of the first token (e.g., "ETH", "USDC")'),
    token0_address: z
      .string()
      .optional()
      .describe('The contract address of the first token'),
    token1_symbol: z
      .string()
      .optional()
      .describe('The symbol of the second token (e.g., "ETH", "USDC")'),
    token1_address: z
      .string()
      .optional()
      .describe('The contract address of the second token'),
    fee: z
      .number()
      .optional()
      .default(0.05)
      .describe(
        'The fee tier as a percentage (e.g., 0.05 for 0.05%, 0.3 for 0.3%, 1 for 1%, defaults to 0.05)'
      ),
    tick_spacing: z
      .number()
      .optional()
      .default(0.1)
      .describe(
        'The tick spacing as a percentage (e.g., 0.01 for 0.01%, 0.1 for 0.1%, 1 for 1%, defaults to 0.1)'
      ),
    extension: z
      .string()
      .optional()
      .default('0x0')
      .describe('The extension contract address (default: "0x0")'),
  })
  .refine((data) => data.token0_symbol || data.token0_address, {
    message: 'Either token0_symbol or token0_address must be provided',
    path: ['token0_symbol'],
  })
  .refine((data) => data.token1_symbol || data.token1_address, {
    message: 'Either token1_symbol or token1_address must be provided',
    path: ['token1_symbol'],
  });

export type PoolKey = z.infer<typeof poolKeySchema>;

export const getTokenPriceSchema = z
  .object({
    token_symbol: z
      .string()
      .optional()
      .describe(
        'The symbol of the token to get the price for (e.g., "ETH", "USDC")'
      ),
    token_address: z
      .string()
      .optional()
      .describe('The contract address of the token to get the price for'),
    quote_currency_symbol: z
      .string()
      .optional()
      .describe('The symbol of the quote currency (e.g., "USDC", "ETH")'),
    quote_currency_address: z
      .string()
      .optional()
      .describe('The contract address of the quote currency'),
    fee: z
      .number()
      .optional()
      .default(0.05)
      .describe(
        'The fee tier as a percentage (e.g., 0.05 for 0.05%, 0.3 for 0.3%, 1 for 1%, defaults to 0.05)'
      ),
    tick_spacing: z
      .number()
      .optional()
      .default(0.1)
      .describe(
        'The tick spacing as a percentage (e.g., 0.01 for 0.01%, 0.1 for 0.1%, 1 for 1%, defaults to 0.1)'
      ),
    extension: z
      .string()
      .optional()
      .default('0x0')
      .describe('The extension contract address (default: "0x0")'),
  })
  .refine((data) => data.token_symbol || data.token_address, {
    message: 'Either token_symbol or token_address must be provided',
    path: ['token_symbol'],
  })
  .refine((data) => data.quote_currency_symbol || data.quote_currency_address, {
    message:
      'Either quote_currency_symbol or quote_currency_address must be provided',
    path: ['quote_currency_symbol'],
  });

export type GetTokenPriceSchema = z.infer<typeof getTokenPriceSchema>;

export const swapTokensSchema = z
  .object({
    token_in_symbol: z
      .string()
      .optional()
      .describe('The symbol of the token to sell (e.g., "ETH", "USDC")'),
    token_in_address: z
      .string()
      .optional()
      .describe('The contract address of the token to sell'),
    token_out_symbol: z
      .string()
      .optional()
      .describe('The symbol of the token to buy (e.g., "ETH", "USDC")'),
    token_out_address: z
      .string()
      .optional()
      .describe('The contract address of the token to buy'),
    amount: z
      .string()
      .describe(
        'The amount to swap (in token decimals, e.g., "1000000" for 1 USDC with 6 decimals)'
      ),
    is_amount_in: z
      .boolean()
      .optional()
      .default(true)
      .describe(
        'If true, amount is input token amount. If false, amount is desired output token amount'
      ),
    slippage_tolerance: z
      .number()
      .optional()
      .default(0.5)
      .describe(
        'Maximum slippage tolerance as a percentage (e.g., 0.5 for 0.5%, defaults to 0.5%)'
      ),
    fee: z
      .number()
      .optional()
      .default(0.05)
      .describe(
        'The fee tier as a percentage (e.g., 0.05 for 0.05%, 0.3 for 0.3%, 1 for 1%, defaults to 0.05)'
      ),
    tick_spacing: z
      .number()
      .optional()
      .default(0.1)
      .describe(
        'The tick spacing as a percentage (e.g., 0.01 for 0.01%, 0.1 for 0.1%, 1 for 1%, defaults to 0.1)'
      ),
    extension: z
      .string()
      .optional()
      .default('0x0')
      .describe('The extension contract address (default: "0x0")'),
  })
  .refine((data) => data.token_in_symbol || data.token_in_address, {
    message: 'Either token_in_symbol or token_in_address must be provided',
    path: ['token_in_symbol'],
  })
  .refine((data) => data.token_out_symbol || data.token_out_address, {
    message: 'Either token_out_symbol or token_out_address must be provided',
    path: ['token_out_symbol'],
  });

export type SwapTokensSchema = z.infer<typeof swapTokensSchema>;

export const addLiquiditySchema = z.object({
  position_id: z
    .number()
    .describe('The NFT position ID (u64) to add liquidity to'),
  amount0: z
    .string()
    .describe('The amount of token0 to add (in token decimals)'),
  amount1: z
    .string()
    .describe('The amount of token1 to add (in token decimals)'),
  token0_symbol: z
    .string()
    .optional()
    .describe(
      'The symbol of the first token (e.g., "ETH", "USDC"). If not provided, will be fetched from position data.'
    ),
  token0_address: z
    .string()
    .optional()
    .describe(
      'The contract address of the first token. If not provided, will be fetched from position data.'
    ),
  token1_symbol: z
    .string()
    .optional()
    .describe(
      'The symbol of the second token (e.g., "ETH", "USDC"). If not provided, will be fetched from position data.'
    ),
  token1_address: z
    .string()
    .optional()
    .describe(
      'The contract address of the second token. If not provided, will be fetched from position data.'
    ),
});

export type AddLiquiditySchema = z.infer<typeof addLiquiditySchema>;

export const withdrawLiquiditySchema = z.object({
  position_id: z.number().describe('The NFT position ID (u64)'),
  liquidity_amount: z
    .string()
    .describe(
      'The amount of liquidity to remove (as a string to handle large numbers, set to "0" for fees only)'
    ),
  fees_only: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      'Set to true to only collect fees without withdrawing liquidity (defaults to false)'
    ),
  collect_fees: z
    .boolean()
    .optional()
    .default(true)
    .describe('Whether to collect accumulated fees (defaults to true)'),
  token0_symbol: z
    .string()
    .optional()
    .describe(
      'The symbol of the first token (e.g., "ETH", "USDC"). If not provided, will be fetched from position data.'
    ),
  token0_address: z
    .string()
    .optional()
    .describe(
      'The contract address of the first token. If not provided, will be fetched from position data.'
    ),
  token1_symbol: z
    .string()
    .optional()
    .describe(
      'The symbol of the second token (e.g., "ETH", "USDC"). If not provided, will be fetched from position data.'
    ),
  token1_address: z
    .string()
    .optional()
    .describe(
      'The contract address of the second token. If not provided, will be fetched from position data.'
    ),
});

export type WithdrawLiquiditySchema = z.infer<typeof withdrawLiquiditySchema>;

export const transferPositionSchema = z.object({
  position_id: z.number().describe('The NFT position ID to transfer (u64)'),
  to_address: z
    .string()
    .describe('The recipient address to transfer the position to'),
});

export type TransferPositionSchema = z.infer<typeof transferPositionSchema>;

export const createPositionSchema = z
  .object({
    amount0: z
      .string()
      .describe('The amount of token0 to add (in token decimals)'),
    amount1: z
      .string()
      .describe('The amount of token1 to add (in token decimals)'),
    token0_symbol: z
      .string()
      .optional()
      .describe('The symbol of the first token (e.g., "ETH", "USDC")'),
    token0_address: z
      .string()
      .optional()
      .describe('The contract address of the first token'),
    token1_symbol: z
      .string()
      .optional()
      .describe('The symbol of the second token (e.g., "ETH", "USDC")'),
    token1_address: z
      .string()
      .optional()
      .describe('The contract address of the second token'),
    lower_price: z
      .number()
      .describe(
        'The minimum price (token1/token0) for the position range. This will be converted to lower_tick automatically.'
      ),
    upper_price: z
      .number()
      .describe(
        'The maximum price (token1/token0) for the position range. This will be converted to upper_tick automatically.'
      ),
    fee: z
      .number()
      .optional()
      .default(0.05)
      .describe(
        'The fee tier as a percentage (e.g., 0.05 for 0.05%, 0.3 for 0.3%, 1 for 1%, defaults to 0.05)'
      ),
    tick_spacing: z
      .number()
      .optional()
      .default(0.1)
      .describe(
        'The tick spacing as a percentage (e.g., 0.01 for 0.01%, 0.1 for 0.1%, 1 for 1%, defaults to 0.1)'
      ),
    extension: z
      .string()
      .optional()
      .default('0x0')
      .describe('The extension contract address (default: "0x0")'),
  })
  .refine((data) => data.token0_symbol || data.token0_address, {
    message: 'Either token0_symbol or token0_address must be provided',
    path: ['token0_symbol'],
  })
  .refine((data) => data.token1_symbol || data.token1_address, {
    message: 'Either token1_symbol or token1_address must be provided',
    path: ['token1_symbol'],
  });

export type CreatePositionSchema = z.infer<typeof createPositionSchema>;
