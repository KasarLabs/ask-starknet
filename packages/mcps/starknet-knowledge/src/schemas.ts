import { z } from 'zod';

/**
 * Schema for the starknet_general_knowledge tool
 * Specialized for general Starknet ecosystem knowledge, concepts, and news
 */
export const starknetGeneralKnowledgeSchema = z.object({
  query: z
    .string()
    .describe(
      "The user's question about Starknet ecosystem, concepts, recent updates, or general knowledge. This is for understanding the Starknet protocol, ecosystem projects, news, and high-level concepts (e.g., 'What are the latest updates in Starknet?' or 'Explain account abstraction in Starknet')."
    ),
  history: z
    .array(z.string())
    .optional()
    .describe(
      'Optional: The preceding conversation history. This can help the tool understand the context of the discussion and provide more accurate answers.'
    ),
});

export type StarknetGeneralKnowledgeInput = z.infer<
  typeof starknetGeneralKnowledgeSchema
>;
