import z from 'zod';

// Schema for memecoin creation parameters
export const contractAddressSchema = z.object({
  contractAddress: z.string().describe('The address of the contract'),
});

export const createMemecoinSchema = z.object({
  owner: z
    .string()
    .regex(/^0x[0-9a-fA-F]{1,64}$/)
    .describe(
      'Owner address of the memecoin (must be a valid Starknet address, can be simplified)'
    ),
  name: z.string().describe('Name of the memecoin'),
  symbol: z.string().describe('Symbol/ticker of the memecoin'),
  initialSupply: z.string().describe('Initial supply of tokens'),
  salt: z
    .string()
    .optional()
    .describe('Optional salt for contract address generation'),
});
/**
 * Schema for launching a memecoin on Ekubo DEX
 */
export const launchOnEkuboSchema = z
  .object({
    // Memecoin contract address
    memecoinAddress: z
      .string()
      .regex(/^0x[0-9a-fA-F]{1,64}$/)
      .describe(
        'Address of the memecoin contract to be launched (can be simplified)'
      ),

    // Transfer restriction delay (in seconds)
    transferRestrictionDelay: z
      .number()
      .min(0)
      .describe(
        'Time period in seconds during which transfers are restricted after launch. Example: 86400 for 24 hours'
      ),

    // Maximum percentage that can be bought at launch
    maxPercentageBuyLaunch: z
      .number()
      .min(0)
      .max(100)
      .describe(
        'Maximum percentage of total supply that can be bought by a single address at launch. Range: 1-100'
      ),

    // Quote token (STRK, ETH, or USDC)
    quoteToken: z
      .enum(['STRK', 'ETH', 'USDC'])
      .describe(
        'Quote token used for the trading pair. Must be one of: STRK, ETH, or USDC'
      ),

    // Initial token holders
    initialHolders: z
      .array(z.string().regex(/^0x[0-9a-fA-F]{1,64}$/))
      .describe(
        'Array of addresses that will receive initial token distribution (can be simplified)'
      ),

    // Initial token amounts for each holder
    initialHoldersAmounts: z
      .array(z.string())
      .describe(
        'Array of token amounts in human-readable format (e.g., "1" for 1 token) to be distributed to initial holders'
      ),

    // Pool fee as a decimal percentage (0-100)
    fee: z
      .string()
      .refine(
        (value) => {
          const fee = parseFloat(value);
          return fee >= 0 && fee <= 100; // 0% to 100%
        },
        {
          message: 'Fee must be between 0 and 100 (0% to 100%)',
        }
      )
      .describe('Pool fee as a decimal percentage. Example: "0.3" for 0.3%'),

    // Starting price configuration
    startingMarketCap: z.string().describe('Starting Market Cap in USD'),
  })
  .refine(
    (data) => data.initialHolders.length === data.initialHoldersAmounts.length,
    {
      message: 'Initial holders and amounts arrays must have the same length',
    }
  );

export type LaunchOnEkuboParams = z.infer<typeof launchOnEkuboSchema>;
export type CreateMemecoinParams = z.infer<typeof createMemecoinSchema>;
export type ContractAddressParams = z.infer<typeof contractAddressSchema>;
