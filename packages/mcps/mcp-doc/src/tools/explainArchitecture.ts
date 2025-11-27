import { z } from 'zod';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { explainArchitectureSchema } from '../schemas/index.js';
import { toolResult } from '@kasarlabs/ask-starknet-core';

const currentDir = __dirname;

/**
 * Explain Ask Starknet architecture and how it works
 */
export const explainArchitecture = async (
  params: z.infer<typeof explainArchitectureSchema>
): Promise<toolResult> => {
  try {
    // Read the architecture markdown file
    const content = readFileSync(
      join(currentDir, '../resources/architecture.md'),
      'utf-8'
    );

    return {
      status: 'success',
      data: { content },
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
