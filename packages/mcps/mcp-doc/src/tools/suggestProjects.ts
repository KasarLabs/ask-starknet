import { z } from 'zod';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { suggestProjectsSchema } from '../schemas/index.js';
import { toolResult } from '@kasarlabs/ask-starknet-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Suggest project ideas that can be built with Ask Starknet
 */
export const suggestProjects = async (
  params: z.infer<typeof suggestProjectsSchema>
): Promise<toolResult> => {
  try {
    const content = readFileSync(
      join(__dirname, '../resources/projects.md'),
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
