import { z } from 'zod';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { listCapabilitiesSchema } from '../schemas/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * List Ask Starknet capabilities organized by domains
 */
export const listCapabilities = async (
  params: z.infer<typeof listCapabilitiesSchema>
) => {
  try {
    // Read the capabilities markdown file
    const content = readFileSync(
      join(__dirname, '../resources/capabilities.md'),
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
