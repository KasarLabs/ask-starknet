import { z } from 'zod';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getHelpSchema } from '../schemas/index.js';
import { toolResult } from '@kasarlabs/ask-starknet-core';

const currentDir = __dirname;

/**
 * Provide help on how to use Ask Starknet
 */
export const getHelp = async (
  params: z.infer<typeof getHelpSchema>
): Promise<toolResult> => {
  try {
    // Read the help markdown file
    const content = readFileSync(
      join(currentDir, '../resources/help.md'),
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
