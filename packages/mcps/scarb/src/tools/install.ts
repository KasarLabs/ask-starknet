import { z } from 'zod';
import { getScarbVersion, checkScarbInstalled } from '../lib/utils/index.js';
import { installScarbSchema } from '../schemas/index.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { toolResult } from '@kasarlabs/ask-starknet-core';

const execAsync = promisify(exec);

// installScarbSchema is now imported from schemas/index.js

/**
 * Install Scarb with specified version
 * @param params Installation parameters including optional version
 * @returns JSON string with installation result
 */
export const installScarb = async (
  params: z.infer<typeof installScarbSchema>
): Promise<toolResult> => {
  try {
    // Check if Scarb is already installed
    const currentVersion = await getScarbVersion();
    if (currentVersion !== 'unknown') {
      // If a specific version is requested, check if it matches
      if (params.version && currentVersion.includes(params.version)) {
        return {
          status: 'success',
          data: {
            message: `Scarb version ${params.version} is already installed`,
            currentVersion: currentVersion,
          },
        };
      } else if (!params.version) {
        return {
          status: 'success',
          data: {
            message: `Scarb is already installed (version: ${currentVersion})`,
            currentVersion: currentVersion,
          },
        };
      }
      // If different version requested, continue with installation
    }

    // Construct installation command
    let installCommand = `curl --proto '=https' --tlsv1.2 -sSf https://docs.swmansion.com/scarb/install.sh | sh -s --`;

    if (params.version) {
      installCommand += ` -v ${params.version}`;
    }

    const { stdout, stderr } = await execAsync(installCommand, {
      env: {
        ...process.env,
        PATH: `${process.env.HOME}/.local/bin:${process.env.PATH}`,
      },
    });

    // Small delay to ensure symlink is created and readable
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Verify installation
    await checkScarbInstalled();
    const installedVersion = await getScarbVersion();

    return {
      status: 'success',
      data: {
        message: params.version
          ? `Scarb version ${params.version} installed successfully`
          : 'Scarb installed successfully (latest version)',
        requestedVersion: params.version || 'latest',
        installedVersion: installedVersion,
        output: stdout,
        errors: stderr || undefined,
      },
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
