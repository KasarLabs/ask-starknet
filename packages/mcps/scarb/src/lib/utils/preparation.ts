import { exec } from 'child_process';
import * as fs from 'fs-extra';
import { promisify } from 'util';
import * as path from 'path';
import { getWorkspacePath } from './path.js';

const execAsync = promisify(exec);

/**
 * Import a contract into a Scarb project
 * @param contractContent The contract content
 * @param contractFileName The contract file name
 * @param projectDir The Scarb project directory
 * @returns The import results
 */
export async function importContract(
  contractContent: string,
  contractFileName: string,
  projectDir: string
) {
  const srcDir = path.join(projectDir, 'src');
  const destContractPath = path.join(srcDir, contractFileName);

  try {
    await fs.writeFile(destContractPath, contractContent);

    const libFilePath = path.join(srcDir, 'lib.cairo');
    let libContent = await fs.readFile(libFilePath, 'utf-8');

    const moduleName = path.basename(contractFileName, '.cairo');
    if (!libContent.includes(`mod ${moduleName};`)) {
      libContent += `\nmod ${moduleName};\n`;
    }

    await fs.writeFile(libFilePath, libContent);

    return {
      success: true,
      filePath: destContractPath,
    };
  } catch (error) {
    throw new Error(`Failed to prepare contract: ${error.message}`);
  }
}

/**
 * Add several dependencies to a Scarb project
 * @param dependencies The dependencies to add
 * @param projectDir The Scarb project directory
 */
export async function addSeveralDependancies(
  // dependencies: scarb.Dependency[],
  projectDir: string
) {
  try {
    // if (dependencies && dependencies.length > 0) {
    //   for (const dependency of dependencies) {
    //     await addDependency({
    //       package: dependency.name,
    //       version: dependency.version,
    //       path: projectDir,
    //     });
    //   }
    // }
  } catch (error) {
    throw new Error(`Failed to add several dependencie: ${error.message}`);
  }
}

/**
 * Clean the lib.cairo file in a Scarb project
 * @param projectDir The Scarb project directory
 * @returns The cleaning results
 */
export async function cleanLibCairo(projectDir: string) {
  try {
    const srcDir = path.join(projectDir, 'src');
    const libFilePath = path.join(srcDir, 'lib.cairo');
    const defaultLibContent = `// lib.cairo - Module exports for the project`;

    await fs.writeFile(libFilePath, defaultLibContent, 'utf-8');

    return {
      success: true,
      message: 'lib.cairo file cleaned successfully',
    };
  } catch (error) {
    throw new Error(`Failed to clean lib.cairo: ${error.message}`);
  }
}

/**
 * Gets the paths to the generated Sierra and CASM files for each contract and associates them with artifacts file
 * @param projectDir Path to the project directory
 * @returns Object containing paths to Sierra, CASM files and the starknet_artifacts file
 */
export async function getGeneratedContractFiles(projectDir: string): Promise<{
  sierraFiles: string[];
  casmFiles: string[];
  artifactFile: string;
}> {
  const result = {
    sierraFiles: [] as string[],
    casmFiles: [] as string[],
    artifactFile: path.join(
      projectDir,
      'target/dev',
      path.basename(projectDir) + '.starknet_artifacts.json'
    ),
  };

  try {
    const targetDir = path.join(projectDir, 'target/dev');
    const files = (await fs.readdir(targetDir, {
      recursive: true,
    })) as string[];

    result.sierraFiles = files
      .filter(
        (file) =>
          typeof file === 'string' && file.endsWith('.contract_class.json')
      )
      .map((file) => path.join(targetDir, file));

    result.casmFiles = files
      .filter(
        (file) =>
          typeof file === 'string' &&
          file.endsWith('.compiled_contract_class.json')
      )
      .map((file) => path.join(targetDir, file));
  } catch (error) {
    throw new Error(`Failed to get generated contract files: ${error.message}`);
  }
  return result;
}

/**
 * Adds the #[executable] attribute to a target function in a Cairo file
 *
 * @param filePath Path to the Cairo file to modify
 * @param targetFunction Name of the function to mark as executable
 * @returns Promise<boolean> True if the file was modified, false if no modification was needed
 * @throws Error if the target function cannot be found in the file
 */
export async function addExecutableTag(
  filePath: string,
  targetFunction: string
): Promise<boolean> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const functionRegex = new RegExp(
      `(^|\\n)fn\\s+${targetFunction}\\s*\\(`,
      'm'
    );
    if (!functionRegex.test(content)) {
      throw new Error(
        `Target function '${targetFunction}' not found in ${filePath}`
      );
    }

    const executableRegex = new RegExp(
      `(^|\\n)#\\[executable\\]\\s*\\n\\s*fn\\s+${targetFunction}\\s*\\(`,
      'm'
    );
    if (executableRegex.test(content)) {
      return false;
    }

    const modifiedContent = content.replace(
      functionRegex,
      `\n#[executable]\nfn ${targetFunction}(`
    );

    await fs.writeFile(filePath, modifiedContent);

    return true;
  } catch (error) {
    throw new Error(`Failed to add executable tag: ${error.message}`);
  }
}

/**
 * Processes a contract for execution by importing it into a Scarb project and marking a target function as executable
 * @param contractContent The contract content
 * @param contractFileName The contract file name
 * @param projectDir The Scarb project directory
 * @param targetFunction The name of the function to mark as executable
 */
export async function processContractForExecution(
  contractContent: string,
  contractFileName: string,
  projectDir: string,
  targetFunction: string
): Promise<void> {
  try {
    const result = await importContract(
      contractContent,
      contractFileName,
      projectDir
    );
    const destContractPath = result.filePath;
    await addExecutableTag(destContractPath, targetFunction);
  } catch (error) {
    throw new Error(`Failed to process contract: ${error.message}`);
  }
}

/**
 * Adds a dependency to a Scarb project
 * @param params The dependency parameters
 * @returns The dependency addition results
 */
export const addDependency = async (params: {
  package: string;
  version?: string;
  path?: string;
}) => {
  try {
    const workingDir = params.path || process.cwd();
    let command = `scarb add ${params.package}`;

    if (params.version) {
      command += `@${params.version}`;
    }
    const { stdout, stderr } = await execAsync(command, { cwd: workingDir });

    return JSON.stringify({
      status: 'success',
      message: `Dependency ${params.package} added successfully`,
      output: stdout,
      errors: stderr || undefined,
    });
  } catch (error) {
    throw new Error(
      `Failed to add dependancie to scarb project: ${error.message}`
    );
  }
};

/**
 * Checks if a Scarb project has been initialized
 * @param projectDir The Scarb project directory
 * @returns True if the project has been initialized, false otherwise
 */
export async function isProjectInitialized(
  projectDir: string
): Promise<boolean> {
  try {
    const scarbTomlPath = path.join(projectDir, 'Scarb.toml');
    await fs.access(scarbTomlPath);

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get a Scarb project directory
 * @param projectName The project name
 * @returns The project directory
 */
export async function getProjectDir(projectName: string) {
  const workspaceDir = getWorkspacePath();
  try {
    await fs.mkdir(workspaceDir, { recursive: true });
  } catch (error) {}

  return path.join(workspaceDir, projectName);
}
