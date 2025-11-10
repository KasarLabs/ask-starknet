import { z } from 'zod';

// Token type enum
export const tokenTypeEnum = z.enum(['STRK', 'WBTC', 'tBTC', 'LBTC']);
export type TokenType = z.infer<typeof tokenTypeEnum>;

// Stake tokens (STRK, WBTC, tBTC, LBTC) to receive liquid staking tokens
export const stakeSchema = z.object({
  token_type: tokenTypeEnum.describe(
    'Type of token to stake: STRK, WBTC, tBTC, or LBTC'
  ),
  amount: z
    .string()
    .describe(
      'Amount to stake in token decimals (e.g., "1000000000000000000" for 1 STRK with 18 decimals, "100000000" for 1 WBTC with 8 decimals)'
    ),
});

export type StakeSchema = z.infer<typeof stakeSchema>;

// Unstake liquid tokens via withdraw queue (1-2 days waiting period)
export const unstakeSchema = z.object({
  token_type: tokenTypeEnum.describe(
    'Type of liquid token to unstake: STRK (xSTRK), WBTC (xyWBTC), tBTC (xytBTC), or LBTC (xyLBTC)'
  ),
  amount: z
    .string()
    .describe('Amount of liquid staking token to unstake (in token decimals)'),
});

export type UnstakeSchema = z.infer<typeof unstakeSchema>;

// Claim unstake request after waiting period
export const claimSchema = z.object({
  token_type: tokenTypeEnum.describe(
    'Type of token to claim: STRK, WBTC, tBTC, or LBTC'
  ),
  withdraw_request_id: z
    .string()
    .describe('The NFT ID of the withdraw request to claim'),
});

export type ClaimSchema = z.infer<typeof claimSchema>;

// Preview stake - how much liquid token for X underlying token
export const previewStakeSchema = z.object({
  token_type: tokenTypeEnum.describe('Token type to preview staking for'),
  amount: z.string().describe('Amount to preview staking (in token decimals)'),
});

export type PreviewStakeSchema = z.infer<typeof previewStakeSchema>;

// Preview unstake - how much underlying token for X liquid token
export const previewUnstakeSchema = z.object({
  token_type: tokenTypeEnum.describe('Token type to preview unstaking for'),
  amount: z
    .string()
    .describe(
      'Amount of liquid token to preview unstaking (in token decimals)'
    ),
});

export type PreviewUnstakeSchema = z.infer<typeof previewUnstakeSchema>;

// Get user liquid token balance
export const getUserBalanceSchema = z.object({
  token_type: tokenTypeEnum.describe('Token type to check balance for'),
  user_address: z
    .string()
    .optional()
    .describe(
      'User address to check balance for (optional, defaults to connected account)'
    ),
});

export type GetUserBalanceSchema = z.infer<typeof getUserBalanceSchema>;

// Get total staked amount (TVL) for a token
export const getTotalStakedSchema = z.object({
  token_type: tokenTypeEnum.describe('Token type to get TVL for'),
});

export type GetTotalStakedSchema = z.infer<typeof getTotalStakedSchema>;

// Get withdraw request info
export const getWithdrawRequestInfoSchema = z.object({
  token_type: tokenTypeEnum.describe('Token type of the withdraw request'),
  withdraw_request_id: z
    .string()
    .describe('The NFT ID of the withdraw request to query'),
});

export type GetWithdrawRequestInfoSchema = z.infer<
  typeof getWithdrawRequestInfoSchema
>;

// Get exchange rate for a liquid token
export const getExchangeRateSchema = z.object({
  token_type: tokenTypeEnum.describe('Token type to get exchange rate for'),
});

export type GetExchangeRateSchema = z.infer<typeof getExchangeRateSchema>;

// Get LST stats (APY, exchange rate, TVL) for all tokens from Endur.fi API
export const getLstStatsSchema = z.object({});

export type GetLstStatsSchema = z.infer<typeof getLstStatsSchema>;
