import { z } from 'zod';
import {
  checkScarbInstalled,
  executeProgram as execProgram,
} from '../lib/utils/index.js';
import { executeProject } from '../lib/utils/workspace.js';
import { executeProgramSchema } from '../schemas/index.js';
import { toolResult } from '@kasarlabs/ask-starknet-core';

/**
 * Execute a Cairo program
 * @param params The parameters for execution
 * @returns JSON string with execution result
 */
export const executeProgram = async (
  params: z.infer<typeof executeProgramSchema>
): Promise<toolResult> => {
  try {
    await checkScarbInstalled();

    let executableName = undefined;
    let executableFunction = undefined;
    if (
      params.executable?.executableType === 'TARGET' &&
      params.executable?.executableValue
    ) {
      executableName = params.executable.executableValue;
    }
    if (
      params.executable?.executableType === 'FUNCTION' &&
      params.executable?.executableValue
    ) {
      executableFunction = params.executable.executableValue;
    }

    const result = await executeProject(
      params.path || (process.cwd() as string),
      params.mode || undefined,
      executableName,
      executableFunction,
      params.arguments || undefined
    );

    return {
      status: 'success',
      data: {
        message: 'Program executed successfully',
        result,
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

export { executeProgramSchema };
