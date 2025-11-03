import z from 'zod';

export const contractAddressSchema = z.object({
  contractAddress: z.string().describe('The address of the contract'),
});

export const blockIdSchema = z.object({
  blockId: z
    .string()
    .describe(
      "The block identifier. Can be 'latest', 'pending', a block hash, or a block number as string."
    ),
});

export const blockIdAndContractAddressSchema = z
  .object({
    blockId: z
      .string()
      .describe(
        "The block identifier. Can be 'latest', 'pending', a block hash, or a block number as string."
      ),
    classHash: z.string().describe('The class hash of the contract'),
  })
  .strict();

export const getStorageAtSchema = z.object({
  blockId: z
    .string()
    .describe(
      "The block identifier. Can be 'latest', 'pending', a block hash, or a block number as string."
    ),
  contractAddress: z.string().describe('The address of the contract'),
  key: z
    .string()
    .describe('The key to the storage value for the given contract'),
});

export const getClassAtSchema = z.object({
  blockId: z
    .string()
    .describe(
      "The block identifier. Can be 'latest', 'pending', a block hash, or a block number as string."
    ),
  contractAddress: z.string().describe('The address of the contract'),
  key: z
    .string()
    .describe('The class for the given contract at the given block'),
});

export const getClassHashAtSchema = z.object({
  blockId: z
    .string()
    .describe(
      "The block identifier. Can be 'latest', 'pending', a block hash, or a block number as string."
    ),
  contractAddress: z.string().describe('The address of the contract'),
  key: z
    .string()
    .describe(
      'The class hash for the given contract at the given block need to be a real class hash'
    ),
});

export const getTransactionByBlockIdAndIndexSchema = z.object({
  blockId: z
    .string()
    .describe(
      "The block identifier. Can be 'latest', 'pending', a block hash, or a block number as string."
    ),
  transactionIndex: z
    .number()
    .describe('The index of the transaction within the block.'),
});

export const transactionHashSchema = z.object({
  transactionHash: z
    .string()
    .describe('The hash of the requested transaction.'),
});

// Types inférés (restent identiques)
export type GetStorageParams = z.infer<typeof getStorageAtSchema>;
export type GetClassAtParams = z.infer<typeof getClassAtSchema>;
export type BlockIdParams = z.infer<typeof blockIdSchema>;
export type BlockIdAndContractAddressParams = z.infer<
  typeof blockIdAndContractAddressSchema
>;
export type GetTransactionByBlockIdAndIndexParams = z.infer<
  typeof getTransactionByBlockIdAndIndexSchema
>;
export type ContractAddressParams = z.infer<typeof contractAddressSchema>;
export type TransactionHashParams = z.infer<typeof transactionHashSchema>;
