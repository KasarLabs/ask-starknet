#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import {
  mcpTool,
  registerToolsWithServer,
  getOnchainRead,
} from '@ijusttookadnatest/ask-starknet-core-test';
import dotenv from 'dotenv';

import { wrapAccountCreationResponse } from './lib/utils/AccountManager.js';
import { accountDetailsSchema } from './schemas/schema.js';
import { DeployOKXAccount } from './tools/deployAccount.js';
import { CreateOKXAccount } from './tools/createAccount.js';

dotenv.config();

const server = new McpServer({
  name: 'starknet-okx-mcp',
  version: '0.0.1',
});

const registerTools = (OkxToolRegistry: mcpTool[]) => {
  OkxToolRegistry.push({
    name: 'create_new_okx_account',
    description:
      'Create a new OKX account and return the privateKey/publicKey/contractAddress',
    execute: async () => {
      const response = await CreateOKXAccount();
      response;
    },
  });

  OkxToolRegistry.push({
    name: 'deploy_existing_okx_account',
    description:
      'Deploy an existing OKX Account return the privateKey/publicKey/contractAddress',
    schema: accountDetailsSchema,
    execute: async (params: any) => {
      const onchainRead = getOnchainRead();
      return await DeployOKXAccount(onchainRead as any, params);
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
  console.error('Starknet OKX MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
