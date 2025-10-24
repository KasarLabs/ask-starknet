#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import * as dotenv from 'dotenv';

import { mcpTool, registerToolsWithServer } from '@ask-starknet/core';
import { initProject } from './tools/init.js';
import { buildProject } from './tools/build.js';
import { executeProgram } from './tools/execute.js';
import { installScarb } from './tools/install.js';
import { proveProgram } from './tools/prove.js';
import { verifyProgram } from './tools/verify.js';
import {
  installScarbSchema,
  initProjectSchema,
  buildProjectSchema,
  executeProgramSchema,
  proveProgramSchema,
  verifyProgramSchema,
} from './schemas/index.js';

dotenv.config();

const server = new McpServer({
  name: 'starknet-scarb-mcp',
  version: '0.0.1',
});

const registerTools = (ScarbToolRegistry: mcpTool[]) => {
  ScarbToolRegistry.push({
    name: 'install_scarb',
    description:
      'Install Scarb Cairo toolchain with optional version specification',
    schema: installScarbSchema,
    execute: installScarb,
  });

  ScarbToolRegistry.push({
    name: 'init_project',
    description:
      'Initialize a new Scarb project with specified name and options',
    schema: initProjectSchema,
    execute: initProject,
  });

  ScarbToolRegistry.push({
    name: 'build_project',
    description: 'Build a Scarb project with specified build options',
    schema: buildProjectSchema,
    execute: buildProject,
  });

  ScarbToolRegistry.push({
    name: 'execute_program',
    description: 'Execute a Cairo program with optional function and arguments',
    schema: executeProgramSchema,
    execute: executeProgram,
  });

  ScarbToolRegistry.push({
    name: 'prove_program',
    description:
      'Generate a proof for a Cairo program execution using Stone prover',
    schema: proveProgramSchema,
    execute: proveProgram,
  });

  ScarbToolRegistry.push({
    name: 'verify_program',
    description: 'Verify a proof generated for a Cairo program',
    schema: verifyProgramSchema,
    execute: verifyProgram,
  });
};

export const RegisterToolInServer = async () => {
  const tools: mcpTool[] = [];
  registerTools(tools);
  await registerToolsWithServer(server, tools);
};

async function main() {
  const transport = new StdioServerTransport();

  await RegisterToolInServer();
  await server.connect(transport);
  console.error('Starknet Scarb MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
