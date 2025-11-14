import { z } from 'zod';
import {
  checkScarbInstalled,
  buildProject as buildScarbProject,
} from '../lib/utils/index.js';
import { buildProjectSchema } from '../schemas/index.js';
import { toolResult } from '@kasarlabs/ask-starknet-core';

/**
 * Build a Scarb project
 * @param params The parameters for building the project
 * @returns JSON string with build result
 */
export const buildProject = async (
  params: z.infer<typeof buildProjectSchema>
): Promise<toolResult> => {
  try {
    await checkScarbInstalled();

    const projectDir = params.path || process.cwd();
    const result = await buildScarbProject(projectDir);

    return {
      status: 'success',
      data: {
        message: 'Project built successfully',
        ...JSON.parse(result),
        buildPath: projectDir,
      },
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error.message,
    };
  }
};

// buildProjectSchema is now exported from schemas/index.js
