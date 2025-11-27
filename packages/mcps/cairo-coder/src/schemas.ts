import { z } from 'zod';

/**
 * Schema for the assist_with_cairo tool
 * Specialized for Cairo code generation, debugging, and technical assistance
 */
export const assistWithCairoSchema = z.object({
  query: z
    .string()
    .describe(
      "The user's technical question about writing, refactoring, debugging, or understanding Cairo code. Be as specific as possible for better results (e.g., 'How to implement an ERC20 transfer function with OpenZeppelin' rather than just 'ERC20')."
    ),
  codeSnippets: z
    .array(z.string())
    .optional()
    .describe(
      "Optional: Code snippets for context. This will help the tool understand the user's intent and provide more accurate answers. Provide as much relevant code as possible to fit the user's request."
    ),
  history: z
    .array(z.string())
    .optional()
    .describe(
      'Optional: The preceding conversation history. This can help the tool understand the context of the discussion and provide more accurate answers.'
    ),
});

export type AssistWithCairoInput = z.infer<typeof assistWithCairoSchema>;