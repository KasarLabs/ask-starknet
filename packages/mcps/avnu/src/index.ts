#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import {
  mcpTool,
  registerToolsWithServer,
  getOnchainWrite,
} from '@ask-starknet/core';
import dotenv from 'dotenv';

import { routeSchema, swapSchema } from './schemas/index.js';
import { swapTokens } from './tools/swap.js';
import { getRoute } from './tools/fetchRoute.js';

dotenv.config();

const server = new McpServer({
  name: 'starknet-avnu-mcp',
  version: '0.0.1',
});

const registerTools = (AvnuToolRegistry: mcpTool[]) => {
  AvnuToolRegistry.push({
    name: 'avnu_swap_tokens',
    description: 'Swap a specified amount of one token for another token',
    schema: swapSchema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await swapTokens(onchainWrite as any, params);
    },
  });

  AvnuToolRegistry.push({
    name: 'avnu_get_route',
    description: 'Get a specific route',
    schema: routeSchema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await getRoute(onchainWrite as any, params);
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
  console.error('Starknet AVNU MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
