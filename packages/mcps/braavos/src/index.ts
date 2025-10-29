#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import {
  mcpTool,
  registerToolsWithServer,
  getOnchainRead,
} from '@kasarlabs/ask-starknet-core';
import dotenv from 'dotenv';

import { wrapAccountCreationResponse } from './lib/utils/AccountManager.js';
import { accountDetailsSchema } from './schemas/index.js';
import { DeployBraavosAccount } from './tools/deployAccount.js';
import { CreateBraavosAccount } from './tools/createAccount.js';

dotenv.config();

const server = new McpServer({
  name: 'starknet-braavos-mcp',
  version: '0.0.1',
});

const registerTools = (BraavosToolRegistry: mcpTool[]) => {
  BraavosToolRegistry.push({
    name: 'create_new_braavos_account',
    description:
      'Create a new Braavos account and return the privateKey/publicKey/contractAddress',
    execute: async () => {
      return await CreateBraavosAccount();
    },
  });

  BraavosToolRegistry.push({
    name: 'deploy_existing_braavos_account',
    description:
      'Deploy an existing Braavos Account return the privateKey/publicKey/contractAddress',
    schema: accountDetailsSchema,
    execute: async (params: any) => {
      const onchainRead = getOnchainRead();
      return await DeployBraavosAccount(onchainRead, params);
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
  console.error('Starknet Braavos MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
