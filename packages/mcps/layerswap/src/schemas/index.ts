import z from 'zod';

// Get Networks
export const getNetworksSchema = z.object({
  network_types: z
    .array(z.string())
    .optional()
    .describe(
      'Filter networks by type. Possible values: evm, starknet, solana, cosmos, starkex, zksynclite, ton, paradex, tron, fuel, bitcoin, hyperliquid'
    ),
});

// Get Sources
export const getSourcesSchema = z.object({
  destination_network: z
    .string()
    .optional()
    .describe(
      'Destination network name - use the network name property (e.g., ETHEREUM_MAINNET, BASE_MAINNET)'
    ),
  destination_token: z
    .string()
    .optional()
    .describe('Destination token symbol - use the token symbol property (e.g., ETH)'),
  include_swaps: z
    .boolean()
    .optional()
    .describe('Whether to include swaps in the response'),
  include_unavailable: z
    .boolean()
    .optional()
    .describe('Whether to include unavailable sources'),
  include_unmatched: z
    .boolean()
    .optional()
    .describe('Whether to include unmatched sources'),
  has_deposit_address: z
    .boolean()
    .optional()
    .describe('Whether to filter sources that have deposit addresses'),
  network_types: z
    .array(z.string())
    .optional()
    .describe(
      'Filter sources by network type. Possible values: evm, starknet, solana, cosmos, starkex, zksynclite, ton, paradex, tron, fuel, bitcoin, hyperliquid'
    ),
});

// Get Destinations
export const getDestinationsSchema = z.object({
  source_network: z
    .string()
    .optional()
    .describe(
      'Source network name - use the network name property (e.g., ETHEREUM_MAINNET, BASE_MAINNET)'
    ),
  source_token: z
    .string()
    .optional()
    .describe('Source token symbol - use the token symbol property (e.g., ETH)'),
  include_swaps: z
    .boolean()
    .optional()
    .describe('Whether to include swaps in the response'),
  include_unavailable: z
    .boolean()
    .optional()
    .describe('Whether to include unavailable destinations'),
  include_unmatched: z
    .boolean()
    .optional()
    .describe('Whether to include unmatched destinations'),
  network_types: z
    .array(z.string())
    .optional()
    .describe(
      'Filter destinations by network type. Possible values: evm, starknet, solana, cosmos, starkex, zksynclite, ton, paradex, tron, fuel, bitcoin, hyperliquid'
    ),
});

// Get Swap Route Limits
export const getSwapRouteLimitsSchema = z.object({
  source_network: z
    .string()
    .describe(
      'Source network name - use the network name property (e.g., ETHEREUM_MAINNET, BASE_MAINNET)'
    ),
  source_token: z
    .string()
    .describe(
      'Source token symbol - use the token symbol property (e.g., ETH)'
    ),
  destination_network: z
    .string()
    .describe(
      'Destination network name - use the network name property (e.g., ETHEREUM_MAINNET, BASE_MAINNET)'
    ),
  destination_token: z
    .string()
    .describe(
      'Destination token symbol - use the token symbol property (e.g., ETH)'
    ),
  use_deposit_address: z
    .boolean()
    .optional()
    .describe('Whether to use deposit address'),
  refuel: z.boolean().optional().describe('Whether to include refuel'),
});

// Get Quote
export const getQuoteSchema = z.object({
  source_network: z
    .string()
    .describe(
      'Source network name - use the network name property (e.g., ETHEREUM_MAINNET, BASE_MAINNET)'
    ),
  source_token: z
    .string()
    .describe(
      'Source token symbol - use the token symbol property (e.g., ETH)'
    ),
  destination_network: z
    .string()
    .describe(
      'Destination network name - use the network name property (e.g., ETHEREUM_MAINNET, BASE_MAINNET)'
    ),
  destination_token: z
    .string()
    .describe(
      'Destination token symbol - use the token symbol property (e.g., ETH)'
    ),
  amount: z.number().describe('Amount to swap'),
  source_address: z.string().optional().describe('Source address'),
  slippage: z
    .string()
    .optional()
    .describe('Slippage tolerance in percentage format (e.g., 0.1 = 10%)'),
  use_deposit_address: z
    .boolean()
    .optional()
    .describe('Whether to use deposit address'),
  refuel: z.boolean().optional().describe('Whether to include refuel'),
});

// Get Detailed Quote
export const getDetailedQuoteSchema = z.object({
  source_network: z
    .string()
    .describe(
      'Source network name - use the network name property (e.g., ETHEREUM_MAINNET, BASE_MAINNET)'
    ),
  source_token: z
    .string()
    .describe(
      'Source token symbol - use the token symbol property (e.g., ETH)'
    ),
  destination_network: z
    .string()
    .describe(
      'Destination network name - use the network name property (e.g., ETHEREUM_MAINNET, BASE_MAINNET)'
    ),
  destination_token: z
    .string()
    .describe(
      'Destination token symbol - use the token symbol property (e.g., ETH)'
    ),
  use_deposit_address: z
    .boolean()
    .optional()
    .describe('Whether to use deposit address'),
  refuel: z.boolean().optional().describe('Whether to include refuel'),
  source_address: z.string().optional().describe('Source address'),
  slippage: z
    .string()
    .optional()
    .describe('Slippage tolerance in percentage format (e.g., 0.1 = 10%)'),
});

// Get Transaction Status
export const getTransactionStatusSchema = z.object({
  swap_id: z.string().describe('Swap ID to check status'),
});

// Get Swap Details
export const getSwapDetailsSchema = z.object({
  swap_id: z.string().describe('Swap ID to get details'),
});

// Get Deposit Actions
export const getDepositActionsSchema = z.object({
  swap_id: z.string().describe('Swap ID to get deposit actions'),
});

// Get All Swaps
export const getAllSwapsSchema = z.object({
  address: z.string().describe('Destination address to retrieve swaps for'),
  page: z.number().optional().describe('Page number for pagination'),
  include_expired: z.boolean().optional().describe('Include expired swaps'),
});

// Create Swap
export const createSwapSchema = z.object({
  source: z
    .string()
    .describe(
      'Source network name - use the network name property (e.g., ETHEREUM_MAINNET, BASE_MAINNET)'
    ),
  destination: z
    .string()
    .describe(
      'Destination network name - use the network name property (e.g., ETHEREUM_MAINNET, BASE_MAINNET)'
    ),
  source_asset: z
    .string()
    .describe(
      'Source asset symbol - use the token symbol property (e.g., ETH)'
    ),
  destination_asset: z
    .string()
    .optional()
    .describe(
      'Destination asset symbol - use the token symbol property (e.g., ETH)'
    ),
  amount: z.string().describe('Amount to swap'),
  destination_address: z.string().describe('Destination address'),
  refuel: z.boolean().optional().describe('Whether to include refuel'),
  source_address: z.string().optional().describe('Source address'),
});

export type GetNetworksSchemaType = z.infer<typeof getNetworksSchema>;
export type GetSourcesSchemaType = z.infer<typeof getSourcesSchema>;
export type GetDestinationsSchemaType = z.infer<typeof getDestinationsSchema>;
export type GetSwapRouteLimitsSchemaType = z.infer<
  typeof getSwapRouteLimitsSchema
>;
export type GetQuoteSchemaType = z.infer<typeof getQuoteSchema>;
export type GetDetailedQuoteSchemaType = z.infer<typeof getDetailedQuoteSchema>;
export type GetTransactionStatusSchemaType = z.infer<
  typeof getTransactionStatusSchema
>;
export type GetSwapDetailsSchemaType = z.infer<typeof getSwapDetailsSchema>;
export type GetDepositActionsSchemaType = z.infer<
  typeof getDepositActionsSchema
>;
export type GetAllSwapsSchemaType = z.infer<typeof getAllSwapsSchema>;
export type CreateSwapSchemaType = z.infer<typeof createSwapSchema>;
