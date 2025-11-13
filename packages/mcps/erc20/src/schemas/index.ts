import { z } from 'zod';

/**
 * Base schema for asset identification (token address or symbol)
 * Requires either assetAddress or assetSymbol to be provided
 * @typedef {Object} AssetSchema
 * @property {string} [assetAddress] - The contract address of the ERC20 token
 * @property {string} [assetSymbol] - The symbol of the ERC20 token
 */
export const assetSchema = z
  .object({
    assetAddress: z
      .string()
      .optional()
      .describe('The contract address of the ERC20 token'),
    assetSymbol: z
      .string()
      .optional()
      .describe('The symbol of the ERC20 token'),
  })
  .refine(
    (data) => data.assetAddress || data.assetSymbol,
    {
      message: 'Either assetAddress or assetSymbol must be provided',
    }
  )
  .describe('The asset information (symbol or contract address)');

export const getAllowanceSchema = z.object({
  ownerAddress: z
    .string()
    .describe('The starknet address of the account owner of the tokens'),
  spenderAddress: z
    .string()
    .describe(
      'The starknet address of the account allowed to spend the tokens'
    ),
  asset: assetSchema,
});

export const getMyGivenAllowanceSchema = z.object({
  spenderAddress: z
    .string()
    .describe(
      'The starknet address of the account allowed to spend the tokens'
    ),
  asset: assetSchema,
});

/**
 * Schema for checking allowances granted to the current user
 * @typedef {Object} AllowanceGivenToMeSchema
 * @property {string} ownerAddress - The address of the account that granted the allowance
 * @property {Object} asset - The asset information (symbol or contract address)
 */
export const getAllowanceGivenToMeSchema = z.object({
  ownerAddress: z
    .string()
    .describe(
      'The starknet address of the account allowed to spend the tokens'
    ),
  asset: assetSchema,
});

/**
 * Schema for getting the total supply of a token
 * @typedef {Object} TotalSupplySchema
 * @property {Object} asset - The asset information (symbol or contract address)
 */
export const getTotalSupplySchema = z.object({
  asset: assetSchema,
});

/**
 * Schema for transferring tokens from one address to another using allowance
 * @typedef {Object} TransferFromSchema
 * @property {string} fromAddress - The address to transfer tokens from
 * @property {string} toAddress - The address to transfer tokens to
 * @property {string} amount - The amount of tokens to transfer
 * @property {Object} asset - The asset information (symbol or contract address)
 */
export const transferFromSchema = z.object({
  fromAddress: z.string().describe('The address to transfer tokens from'),
  toAddress: z.string().describe('The address to transfer tokens to'),
  amount: z.string().describe('The amount of tokens to transfer'),
  asset: assetSchema,
});

/**
 * Schema for batch transfer-from operations
 * @typedef {Object} TransferFromSignatureSchema
 * @property {string} fromAddress - The address to transfer tokens from
 * @property {string} toAddress - The address to transfer tokens to
 * @property {string} amount - The amount of tokens to transfer
 * @property {Object} asset - The asset information (symbol or contract address)
 */
export const transferFromSignatureSchema = z.object({
  fromAddress: z.string().describe('The address to transfer tokens from'),
  toAddress: z.string().describe('The address to transfer tokens to'),
  amount: z.string().describe('The amount of tokens to transfer'),
  asset: assetSchema,
});

/**
 * Schema for checking token balance of an address
 * @typedef {Object} BalanceSchema
 * @property {string} accountAddress - The address to check the balance for
 * @property {Object} asset - The asset information (symbol or contract address)
 */
export const getBalanceSchema = z.object({
  accountAddress: z.string().describe('The address to check the balance for'),
  asset: assetSchema,
});

/**
 * Schema for checking token balance of the current user
 * @typedef {Object} OwnBalanceSchema
 * @property {Object} asset - The asset information (symbol or contract address)
 */
export const getOwnBalanceSchema = z.object({
  asset: assetSchema,
});

/**
 * Schema for generating signature for balance check
 * @typedef {Object} BalanceSignatureSchema
 * @property {string} accountAddress - The address to check the balance for
 * @property {Object} asset - The asset information (symbol or contract address)
 */
export const getBalanceSignatureSchema = z.object({
  accountAddress: z.string().describe('The address to check the balance for'),
  asset: assetSchema,
});

/**
 * Schema for approving token spending
 * @typedef {Object} ApproveSchema
 * @property {string} spenderAddress - The address being approved to spend tokens
 * @property {string} amount - The amount of tokens being approved
 * @property {Object} asset - The asset information (symbol or contract address)
 */
export const approveSchema = z.object({
  spenderAddress: z
    .string()
    .describe('The address being approved to spend tokens'),
  amount: z.string().describe('The amount of tokens being approved'),
  asset: assetSchema,
});

/**
 * Schema for batch approval operations
 * @typedef {Object} ApproveSignatureSchema
 * @property {string} spenderAddress - The address being approved to spend tokens
 * @property {string} amount - The amount of tokens being approved
 * @property {Object} asset - The asset information (symbol or contract address)
 */
export const approveSignatureSchema = z.object({
  spenderAddress: z
    .string()
    .describe('The address being approved to spend tokens'),
  amount: z.string().describe('The amount of tokens being approved'),
  asset: assetSchema,
});

/**
 * Schema for transferring tokens
 * @typedef {Object} TransferSchema
 * @property {string} recipientAddress - The address to receive the tokens
 * @property {string} amount - The amount of tokens to transfer
 * @property {Object} asset - The asset information (symbol or contract address)
 */
export const transferSchema = z.object({
  recipientAddress: z.string().describe('The address to receive the tokens'),
  amount: z.string().describe('The amount of tokens to transfer'),
  asset: assetSchema,
});

/**
 * Schema for batch transfer operations
 * @typedef {Object} TransferSignatureSchema
 * @property {string} recipientAddress - The address to receive the tokens
 * @property {string} amount - The amount of tokens to transfer
 * @property {Object} asset - The asset information (symbol or contract address)
 */
export const transferSignatureSchema = z.object({
  recipientAddress: z.string().describe('The address to receive the tokens'),
  amount: z.string().describe('The amount of tokens to transfer'),
  asset: assetSchema,
});

/**
 * Schema for deploying an ERC20 token
 * @typedef {Object} DeployERC20Schema
 * @property {string} name - The name of the token
 * @property {string} symbol - The symbol of the token
 * @property {string} totalSupply - The total supply to mint at the deployment time
 */
export const deployERC20Schema = z.object({
  name: z.string().describe('The name of the token'),
  symbol: z.string().describe('The symbol of the token'),
  totalSupply: z
    .string()
    .describe('The total supply to mint at the deployment time'),
});

/**
 * Schema for getting the symbol of a token
 * @typedef {Object} GetSymbolSchema
 * @property {string} assetAddress - The address of the token contract
 */
export const getSymbolSchema = z.object({
  assetAddress: z
    .string()
    .describe('The contract address of the ERC20 token to get the symbol for'),
});
