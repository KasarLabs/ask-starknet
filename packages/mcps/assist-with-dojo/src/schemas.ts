import { z } from 'zod';

/**
 * Schema for the assist-with-dojo tool
 * Specialized for Dojo game engine, its components, SDKs, and onchain game development
 */
export const assistWithDojoSchema = z.object({
  query: z
    .string()
    .describe(
      "The user's question about Dojo game engine and its ecosystem. Use this for understanding Dojo core concepts, components (Katana, Torii, Sozo, Saya, Cainome), SDKs (dojo.js, dojo.c, dojo.unity, dojo.rust, dojo.godot, dojo.bevy, dojo.unreal), libraries (Origami, Alexandria), building onchain games, and deploying Dojo worlds (e.g., 'How do I use Katana for local development?' or 'Explain Dojo's ECS architecture')."
    ),
  history: z
    .array(z.string())
    .optional()
    .describe(
      'Optional: The preceding conversation history about Dojo. This can help the tool understand the context of the discussion and provide more accurate answers.'
    ),
});

export type AssistWithDojoInput = z.infer<typeof assistWithDojoSchema>;
