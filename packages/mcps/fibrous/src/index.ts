#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import {
  mcpTool,
  registerToolsWithServer,
  getOnchainWrite,
} from '@ijusttookadnatest/ask-starknet-core';
import dotenv from 'dotenv';

import {
  swapSchema,
  batchSwapSchema,
  routeSchema,
  RouteSchemaType,
} from './schemas/index.js';
import { swapTokensFibrous } from './tools/swap.js';
import { batchSwapTokens } from './tools/batchSwap.js';
import { getRouteFibrous } from './tools/fetchRoute.js';

dotenv.config();

const server = new McpServer({
  name: 'starknet-fibrous-mcp',
  version: '0.0.1',
});

const registerTools = (FibrousToolRegistry: mcpTool[]) => {
  FibrousToolRegistry.push({
    name: 'fibrous_swap',
    description: 'Swap a token for another token',
    schema: swapSchema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await swapTokensFibrous(onchainWrite as any, params);
    },
  });

  FibrousToolRegistry.push({
    name: 'fibrous_batch_swap',
    description: 'Swap multiple tokens for another token',
    schema: batchSwapSchema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await batchSwapTokens(onchainWrite as any, params);
    },
  });

  FibrousToolRegistry.push({
    name: 'fibrous_get_route',
    description: 'Get a specific route for swapping tokens',
    schema: routeSchema,
    execute: async (params: RouteSchemaType) => {
      return await getRouteFibrous(params);
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
  console.error('Starknet Fibrous MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
