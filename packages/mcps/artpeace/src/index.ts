#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import {
  mcpTool,
  registerToolsWithServer,
  getOnchainWrite,
} from '@kasarlabs/ask-starknet-core';

import dotenv from 'dotenv';

import { placePixel } from './tools/placePixel.js';
import { placePixelSchema } from './schemas/index.js';

dotenv.config();

const server = new McpServer({
  name: 'starknet-artpeace-mcp',
  version: '0.0.1',
});

const registerTools = (ArtPeaceToolRegistry: mcpTool[]) => {
  ArtPeaceToolRegistry.push({
    name: 'place_pixel',
    description: 'Places a pixel, all parameters are optional',
    schema: placePixelSchema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await placePixel(onchainWrite as any, params);
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
  console.error('Starknet ArtPeace MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
