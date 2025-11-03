import { z } from 'zod';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { suggestProjectsSchema } from '../schemas/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Suggest project ideas that can be built with Ask Starknet
 */
export const suggestProjects = async (
  params: z.infer<typeof suggestProjectsSchema>
) => {
  try {
    const { domain = 'all' } = params;

    let content: string;

    if (domain === 'all') {
      // Read both defi and other projects
      const defiContent = readFileSync(
        join(__dirname, '../resources/projects/defi.md'),
        'utf-8'
      );
      const otherContent = readFileSync(
        join(__dirname, '../resources/projects/other.md'),
        'utf-8'
      );
      content = `${defiContent}\n\n---\n\n${otherContent}`;
    } else if (domain === 'defi') {
      content = readFileSync(
        join(__dirname, '../resources/projects/defi.md'),
        'utf-8'
      );
    } else {
      // For other domains (nft, gaming, analytics, automation, trading, dev-tools)
      // return the "other" projects file
      content = readFileSync(
        join(__dirname, '../resources/projects/other.md'),
        'utf-8'
      );
    }

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
