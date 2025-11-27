import { z } from 'zod';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { listCapabilitiesSchema } from '../schemas/index.js';
import { toolResult } from '@kasarlabs/ask-starknet-core';

const currentDir = __dirname;

/**
 * List Ask Starknet capabilities organized by domains
 */
export const listCapabilities = async (
  params: z.infer<typeof listCapabilitiesSchema>
): Promise<toolResult> => {
  try {
    // Read the capabilities markdown file
    const content = readFileSync(
      join(currentDir, '../resources/capabilities.md'),
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
