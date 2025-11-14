import { z } from 'zod';
import { proveProgramSchema } from '../schemas/index.js';
import {
  checkScarbInstalled,
  cleanProject,
  formatCompilationError,
} from '../lib/utils/index.js';
import { proveProject } from '../lib/utils/workspace.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import { toolResult } from '@kasarlabs/ask-starknet-core';

const execPromise = promisify(exec);

/**
 * Prove a Cairo program using Stone prover
 * @param params The parameters for proving
 * @returns JSON string with proving result
 */
export const proveProgram = async (
  params: z.infer<typeof proveProgramSchema>
): Promise<toolResult> => {
  let projectDir = '';

  try {
    await checkScarbInstalled();

    const result = await proveProject({
      projectDir: params.path || process.cwd(),
      executionId: params.executionId.toString(),
    });

    const fullPath = path.join(projectDir, result.proofPath);

    return {
      status: 'success',
      data: {
        message: 'Program proved successfully',
        proofPath: fullPath,
        result: result,
        projectPath: projectDir,
      },
    };
  } catch (error) {
    const errors = formatCompilationError(error);
    return {
      status: 'failure',
      error: typeof errors === 'string' ? errors : JSON.stringify(errors),
    };
  } finally {
    if (projectDir) {
      await cleanProject(projectDir);
    }
  }
};
