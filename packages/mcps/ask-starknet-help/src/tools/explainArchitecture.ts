import { z } from 'zod';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { explainArchitectureSchema } from '../schemas/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Explain Ask Starknet architecture and how it works
 */
export const explainArchitecture = async (
  params: z.infer<typeof explainArchitectureSchema>
) => {
  try {
    // Read the architecture markdown file
    const content = readFileSync(
      join(__dirname, '../resources/architecture.md'),
      'utf-8'
    );

    return {
      status: 'success',
      data: content,
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
