#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import {
  mcpTool,
  registerToolsWithServer,
  getOnchainWrite,
} from '@ijusttookadnatest/ask-starknet-core-test';

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

const checkEnv = (): boolean => {
  const rpcUrl = process.env.STARKNET_RPC_URL;
  const accountAddress = process.env.STARKNET_ACCOUNT_ADDRESS;
  const privateKey = process.env.STARKNET_PRIVATE_KEY;

  if (!rpcUrl) {
    console.error('Missing required environment variable: STARKNET_RPC_URL');
    return false;
  }
  if (!accountAddress) {
    console.error(
      'Missing required environment variable: STARKNET_ACCOUNT_ADDRESS'
    );
    return false;
  }
  if (!privateKey) {
    console.error(
      'Missing required environment variable: STARKNET_PRIVATE_KEY'
    );
    return false;
  }
  return true;
};

async function main() {
  const transport = new StdioServerTransport();
  if (!checkEnv()) {
    console.error('Failed to initialize ArtPeace Server');
    process.exit(1);
  }

  await RegisterToolInServer();
  await server.connect(transport);
  console.error('Starknet ArtPeace MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
