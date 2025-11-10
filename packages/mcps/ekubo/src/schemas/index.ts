import { z } from 'zod';

export const assetSchema = z.object({
  assetType: z
    .enum(['SYMBOL', 'ADDRESS'])
    .describe(
      'The type of the asset concerned by the allowance: SYMBOL or ADDRESS'
    ),
  assetValue: z
    .string()
    .describe(
      'The symbol (e.g., "ETH", "USDC") or the contract address of the token'
    ),
});

export const poolKeySchema = z.object({
  token0: z
    .object({
      assetType: z
        .enum(['SYMBOL', 'ADDRESS'])
        .describe(
          'The type of the asset concerned by the allowance: SYMBOL or ADDRESS'
        ),
      assetValue: z
        .string()
        .describe(
          'The symbol (e.g., "ETH", "USDC") or the contract address of the token'
        ),
    })
    .describe(
      'The asset information (symbol or contract address) of the first token in the pool'
    ),
  token1: z
    .object({
      assetType: z
        .enum(['SYMBOL', 'ADDRESS'])
        .describe(
          'The type of the asset concerned by the allowance: SYMBOL or ADDRESS'
        ),
      assetValue: z
        .string()
        .describe(
          'The symbol (e.g., "ETH", "USDC") or the contract address of the token'
        ),
    })
    .describe(
      'The asset information (symbol or contract address) of the second token in the pool'
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
});

export type PoolKey = z.infer<typeof poolKeySchema>;

export const getTokenPriceSchema = z.object({
  token: z
    .object({
      assetType: z
        .enum(['SYMBOL', 'ADDRESS'])
        .describe(
          'The type of the asset concerned by the allowance: SYMBOL or ADDRESS'
        ),
      assetValue: z
        .string()
        .describe(
          'The symbol (e.g., "ETH", "USDC") or the contract address of the token'
        ),
    })
    .describe(
      'The asset information (symbol or contract address) of the token to get the price for'
    ),
  quote_currency: z
    .object({
      assetType: z
        .enum(['SYMBOL', 'ADDRESS'])
        .describe(
          'The type of the asset concerned by the allowance: SYMBOL or ADDRESS'
        ),
      assetValue: z
        .string()
        .describe(
          'The symbol (e.g., "ETH", "USDC") or the contract address of the token'
        ),
    })
    .describe(
      'The asset information (symbol or contract address) of the quote currency (e.g., USDC, ETH)'
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
});

export type GetTokenPriceSchema = z.infer<typeof getTokenPriceSchema>;

export const swapTokensSchema = z.object({
  token_in: z
    .object({
      assetType: z
        .enum(['SYMBOL', 'ADDRESS'])
        .describe(
          'The type of the asset concerned by the allowance: SYMBOL or ADDRESS'
        ),
      assetValue: z
        .string()
        .describe(
          'The symbol (e.g., "ETH", "USDC") or the contract address of the token'
        ),
    })
    .describe(
      'The asset information (symbol or contract address) of the token to sell'
    ),
  token_out: z
    .object({
      assetType: z
        .enum(['SYMBOL', 'ADDRESS'])
        .describe(
          'The type of the asset concerned by the allowance: SYMBOL or ADDRESS'
        ),
      assetValue: z
        .string()
        .describe(
          'The symbol (e.g., "ETH", "USDC") or the contract address of the token'
        ),
    })
    .describe(
      'The asset information (symbol or contract address) of the token to buy'
    ),
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
  token0: z
    .object({
      assetType: z
        .enum(['SYMBOL', 'ADDRESS'])
        .describe(
          'The type of the asset concerned by the allowance: SYMBOL or ADDRESS'
        ),
      assetValue: z
        .string()
        .describe(
          'The symbol (e.g., "ETH", "USDC") or the contract address of the token'
        ),
    })
    .describe(
      'The asset information (symbol or contract address) of the first token'
    ),
  token1: z
    .object({
      assetType: z
        .enum(['SYMBOL', 'ADDRESS'])
        .describe(
          'The type of the asset concerned by the allowance: SYMBOL or ADDRESS'
        ),
      assetValue: z
        .string()
        .describe(
          'The symbol (e.g., "ETH", "USDC") or the contract address of the token'
        ),
    })
    .describe(
      'The asset information (symbol or contract address) of the second token'
    ),
  lower_tick: z.number().describe('The lower tick of the position range'),
  upper_tick: z.number().describe('The upper tick of the position range'),
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
  token0: z
    .object({
      assetType: z
        .enum(['SYMBOL', 'ADDRESS'])
        .describe(
          'The type of the asset concerned by the allowance: SYMBOL or ADDRESS'
        ),
      assetValue: z
        .string()
        .describe(
          'The symbol (e.g., "ETH", "USDC") or the contract address of the token'
        ),
    })
    .describe(
      'The asset information (symbol or contract address) of the first token'
    ),
  token1: z
    .object({
      assetType: z
        .enum(['SYMBOL', 'ADDRESS'])
        .describe(
          'The type of the asset concerned by the allowance: SYMBOL or ADDRESS'
        ),
      assetValue: z
        .string()
        .describe(
          'The symbol (e.g., "ETH", "USDC") or the contract address of the token'
        ),
    })
    .describe(
      'The asset information (symbol or contract address) of the second token'
    ),
  lower_tick: z.number().describe('The lower tick of the position range'),
  upper_tick: z.number().describe('The upper tick of the position range'),
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
});

export type WithdrawLiquiditySchema = z.infer<typeof withdrawLiquiditySchema>;

export const transferPositionSchema = z.object({
  position_id: z.number().describe('The NFT position ID to transfer (u64)'),
  to_address: z
    .string()
    .describe('The recipient address to transfer the position to'),
});

export type TransferPositionSchema = z.infer<typeof transferPositionSchema>;

export const createPositionSchema = z.object({
  amount0: z
    .string()
    .describe('The amount of token0 to add (in token decimals)'),
  amount1: z
    .string()
    .describe('The amount of token1 to add (in token decimals)'),
  token0: z
    .object({
      assetType: z
        .enum(['SYMBOL', 'ADDRESS'])
        .describe(
          'The type of the asset concerned by the allowance: SYMBOL or ADDRESS'
        ),
      assetValue: z
        .string()
        .describe(
          'The symbol (e.g., "ETH", "USDC") or the contract address of the token'
        ),
    })
    .describe(
      'The asset information (symbol or contract address) of the first token'
    ),
  token1: z
    .object({
      assetType: z
        .enum(['SYMBOL', 'ADDRESS'])
        .describe(
          'The type of the asset concerned by the allowance: SYMBOL or ADDRESS'
        ),
      assetValue: z
        .string()
        .describe(
          'The symbol (e.g., "ETH", "USDC") or the contract address of the token'
        ),
    })
    .describe(
      'The asset information (symbol or contract address) of the second token'
    ),
  lower_tick: z.number().describe('The lower tick of the position range'),
  upper_tick: z.number().describe('The upper tick of the position range'),
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
});

export type CreatePositionSchema = z.infer<typeof createPositionSchema>;
