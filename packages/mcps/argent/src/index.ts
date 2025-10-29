#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import dotenv from 'dotenv';

import { CreateArgentAccount } from './tools/createAccount.js';
import { DeployArgentAccount } from './tools/deployAccount.js';
import { accountDetailsSchema } from './schemas/schema.js';
import {
  mcpTool,
  registerToolsWithServer,
  getOnchainRead,
} from '@ijusttookadnatest/core';

dotenv.config();

const server = new McpServer({
  name: 'starknet-argent-mcp',
  version: '0.0.1',
});

const registerTools = (ArgentToolRegistry: mcpTool[]) => {
  ArgentToolRegistry.push({
    name: 'create_new_argent_account',
    description:
      'Creates a new Argent account and return the privateKey/publicKey/contractAddress',
    execute: async () => {
      const onchainRead = getOnchainRead();
      return await CreateArgentAccount(onchainRead);
    },
  });

  ArgentToolRegistry.push({
    name: 'deploy_existing_argent_account',
    description:
      'Deploy an existing Argent Account return the privateKey/publicKey/contractAddress',
    schema: accountDetailsSchema,
    execute: async (params: any) => {
      const onchainRead = getOnchainRead();
      return await DeployArgentAccount(onchainRead, params);
    },
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
  console.error('Starknet Argent MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
