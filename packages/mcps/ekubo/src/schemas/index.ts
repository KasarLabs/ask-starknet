import { z } from 'zod';

export const poolKeySchema = z
  .object({
    token0_symbol: z
      .string()
      .optional()
      .describe(
        'The symbol of the first token (e.g., "STRK", "USDC", "ETH", "WBTC"). Either token0_symbol or token0_address must be provided. Supported symbols include: STRK, USDC, USDT, ETH, DAI, WBTC, and many others.'
      ),
    token0_address: z
      .string()
      .optional()
      .describe(
        'The contract address of the first token. Either token0_symbol or token0_address must be provided.'
      ),
    token1_symbol: z
      .string()
      .optional()
      .describe(
        'The symbol of the second token (e.g., "STRK", "USDC", "ETH", "WBTC"). Either token1_symbol or token1_address must be provided. Supported symbols include: STRK, USDC, USDT, ETH, DAI, WBTC, and many others.'
      ),
    token1_address: z
      .string()
      .optional()
      .describe(
        'The contract address of the second token. Either token1_symbol or token1_address must be provided.'
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

export type PoolKey = z.infer<typeof poolKeySchema>;

export const getTokenPriceSchema = z
  .object({
    token_symbol: z
      .string()
      .optional()
      .describe(
        'The symbol of the token to get the price for (e.g., "STRK", "USDC", "ETH", "WBTC"). Either token_symbol or token_address must be provided. Supported symbols include: STRK, USDC, USDT, ETH, DAI, WBTC, and many others.'
      ),
    token_address: z
      .string()
      .optional()
      .describe(
        'The contract address of the token to get the price for. Either token_symbol or token_address must be provided.'
      ),
    quote_currency_symbol: z
      .string()
      .optional()
      .describe(
        'The symbol of the quote currency (e.g., "STRK", "USDC", "ETH", "WBTC"). Either quote_currency_symbol or quote_currency_address must be provided. Supported symbols include: STRK, USDC, USDT, ETH, DAI, WBTC, and many others.'
      ),
    quote_currency_address: z
      .string()
      .optional()
      .describe(
        'The contract address of the quote currency. Either quote_currency_symbol or quote_currency_address must be provided.'
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
      .describe(
        'The symbol of the token to sell (e.g., "STRK", "USDC", "ETH", "WBTC"). Either token_in_symbol or token_in_address must be provided. Supported symbols include: STRK, USDC, USDT, ETH, DAI, WBTC, and many others.'
      ),
    token_in_address: z
      .string()
      .optional()
      .describe(
        'The contract address of the token to sell. Either token_in_symbol or token_in_address must be provided.'
      ),
    token_out_symbol: z
      .string()
      .optional()
      .describe(
        'The symbol of the token to buy (e.g., "STRK", "USDC", "ETH", "WBTC"). Either token_out_symbol or token_out_address must be provided. Supported symbols include: STRK, USDC, USDT, ETH, DAI, WBTC, and many others.'
      ),
    token_out_address: z
      .string()
      .optional()
      .describe(
        'The contract address of the token to buy. Either token_out_symbol or token_out_address must be provided.'
      ),
    amount: z
      .string()
      .describe('The amount to swap (in human decimals, e.g., "1" for 1 USDC)'),
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
    .int()
    .min(1)
    .describe('The NFT position ID (u64) to add liquidity to'),
  amount0: z
    .string()
    .describe(
      'The amount of token0 to add (in human decimals, e.g., "1" for 1 USDC)'
    ),
  amount1: z
    .string()
    .describe(
      'The amount of token1 to add (in human decimals, e.g., "1" for 1 USDC)'
    ),
  state: z
    .enum(['opened', 'closed'])
    .optional()
    .default('opened')
    .describe(
      'The state of the position to filter by: "opened" for active positions, "closed" for closed positions (defaults to "opened")'
    ),
});

export type AddLiquiditySchema = z.infer<typeof addLiquiditySchema>;

export const withdrawLiquiditySchema = z.object({
  position_id: z.number().int().min(1).describe('The NFT position ID (u64)'),
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
});

export type WithdrawLiquiditySchema = z.infer<typeof withdrawLiquiditySchema>;

export const transferPositionSchema = z.object({
  position_id: z
    .number()
    .int()
    .min(1)
    .describe('The NFT position ID to transfer (u64)'),
  to_address: z
    .string()
    .describe('The recipient address to transfer the position to'),
});

export type TransferPositionSchema = z.infer<typeof transferPositionSchema>;

export const createPositionSchema = z
  .object({
    amount0: z
      .string()
      .describe(
        'The amount of token0 to add (in human decimals, e.g., "1" for 1 USDC)'
      ),
    amount1: z
      .string()
      .describe(
        'The amount of token1 to add (in human decimals, e.g., "1" for 1 USDC)'
      ),
    token0_symbol: z
      .string()
      .optional()
      .describe(
        'The symbol of the first token (e.g., "STRK", "USDC", "ETH", "WBTC"). Either token0_symbol or token0_address must be provided. Supported symbols include: STRK, USDC, USDT, ETH, DAI, WBTC, and many others.'
      ),
    token0_address: z
      .string()
      .optional()
      .describe(
        'The contract address of the first token. Either token0_symbol or token0_address must be provided.'
      ),
    token1_symbol: z
      .string()
      .optional()
      .describe(
        'The symbol of the second token (e.g., "STRK", "USDC", "ETH", "WBTC"). Either token1_symbol or token1_address must be provided. Supported symbols include: STRK, USDC, USDT, ETH, DAI, WBTC, and many others.'
      ),
    token1_address: z
      .string()
      .optional()
      .describe(
        'The contract address of the second token. Either token1_symbol or token1_address must be provided.'
      ),
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

export const getPositionsSchema = z
  .object({
    owner_address: z
      .string()
      .optional()
      .describe('The owner address to fetch positions for'),
    position_id: z
      .number()
      .int()
      .min(1)
      .optional()
      .describe('The NFT position ID (u64) to get liquidity information for'),
    page: z
      .number()
      .int()
      .min(1)
      .optional()
      .default(1)
      .describe('The page number for pagination (default: 1)'),
    pageSize: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .default(50)
      .describe('The number of items per page (default: 50, max: 100)'),
    state: z
      .enum(['opened', 'closed'])
      .optional()
      .default('opened')
      .describe(
        'The state of the position to filter by: "opened" for active positions, "closed" for closed positions (defaults to "opened")'
      ),
  })
  .refine((data) => data.owner_address || data.position_id, {
    message: 'Either owner_address or position_id must be provided',
    path: ['owner_address'],
  });

export type GetPositionsSchema = z.infer<typeof getPositionsSchema>;
