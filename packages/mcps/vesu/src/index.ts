#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import {
  mcpTool,
  registerToolsWithServer,
  getOnchainWrite,
} from '@ask-starknet/core';
import dotenv from 'dotenv';

import { depositEarnSchema, withdrawEarnSchema } from './schemas/index.js';
import { depositEarnPosition } from './tools/depositService.js';
import { withdrawEarnPosition } from './tools/withdrawService.js';

dotenv.config();

const server = new McpServer({
  name: 'starknet-vesu-mcp',
  version: '0.0.1',
});

const registerTools = (VesuToolRegistry: mcpTool[]) => {
  VesuToolRegistry.push({
    name: 'vesu_deposit_earn',
    description: 'Deposit tokens to earn yield on Vesu protocol',
    schema: depositEarnSchema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await depositEarnPosition(onchainWrite as any, params);
    },
  });

  VesuToolRegistry.push({
    name: 'vesu_withdraw_earn',
    description: 'Withdraw tokens from earning position on Vesu protocol',
    schema: withdrawEarnSchema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await withdrawEarnPosition(onchainWrite as any, params);
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
  console.error('Starknet Vesu MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
