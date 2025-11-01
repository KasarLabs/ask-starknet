#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { mcpTool, registerToolsWithServer } from '@kasarlabs/ask-starknet-core';
import dotenv from 'dotenv';

import { getStrategiesSchema } from './schemas/index.js';
import { getStrategies } from './tools/getStrategies.js';

dotenv.config();

const server = new McpServer({
  name: 'starknet-troves-mcp',
  version: '0.0.1',
});

const registerTools = (TrovesToolRegistry: mcpTool[]) => {
  TrovesToolRegistry.push({
    name: 'troves_get_strategies',
    description: 'Get all strategies from Troves API',
    schema: getStrategiesSchema,
    execute: async () => {
      return await getStrategies();
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
  console.error('Starknet Troves MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
