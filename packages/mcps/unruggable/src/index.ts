#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import {
  mcpTool,
  registerToolsWithServer,
  getOnchainWrite,
} from '@ijusttookadnatest/ask-starknet-core-test';
import dotenv from 'dotenv';

import {
  contractAddressSchema,
  launchOnEkuboSchema,
  createMemecoinSchema,
} from './schemas/index.js';
import { getLockedLiquidity } from './tools/getLockedLiquidity.js';
import { isMemecoin } from './tools/isMemecoin.js';
import { createMemecoin } from './tools/createMemecoin.js';
import { launchOnEkubo } from './tools/launchOnEkubo.js';

dotenv.config();

const server = new McpServer({
  name: 'starknet-unruggable-mcp',
  version: '0.0.1',
});

const registerTools = (UnruggableToolRegistry: mcpTool[]) => {
  UnruggableToolRegistry.push({
    name: 'is_memecoin',
    description: 'Check if address is a memecoin',
    schema: contractAddressSchema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await isMemecoin(onchainWrite as any, params);
    },
  });

  UnruggableToolRegistry.push({
    name: 'get_locked_liquidity',
    description: 'Get locked liquidity info for token',
    schema: contractAddressSchema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await getLockedLiquidity(onchainWrite as any, params);
    },
  });

  UnruggableToolRegistry.push({
    name: 'create_memecoin',
    description: 'Create a new memecoin using the Unruggable Factory',
    schema: createMemecoinSchema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await createMemecoin(onchainWrite as any, params);
    },
  });

  UnruggableToolRegistry.push({
    name: 'launch_on_ekubo',
    description: 'Launch a memecoin on Ekubo DEX with concentrated liquidity',
    schema: launchOnEkuboSchema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await launchOnEkubo(onchainWrite as any, params);
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
  console.error('Starknet Unruggable MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
