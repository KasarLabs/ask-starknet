import { z } from 'zod';
import { checkScarbInstalled } from '../lib/utils/index.js';
import { verifyProject } from '../lib/utils/workspace.js';
import { verifyProgramSchema } from '../schemas/index.js';
import { toolResult } from '@kasarlabs/ask-starknet-core';

// verifyProgramSchema is now imported from schemas/index.js

/**
 * Verify a Cairo program proof
 * @param params The parameters for verification
 * @returns JSON string with verification result
 */
export const verifyProgram = async (
  params: z.infer<typeof verifyProgramSchema>
): Promise<toolResult> => {
  try {
    await checkScarbInstalled();

    const result = await verifyProject({
      projectDir: params.path || (process.cwd() as string),
      proofPath: params.proofFile as string,
    });

    return {
      status: 'success',
      data: {
        message: 'Program verification completed',
        result: result,
        projectPath: params.path,
      },
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error.message,
    };
  }
};

// verifyProgramSchema is now exported from schemas/index.js
