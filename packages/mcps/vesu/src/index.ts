#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import {
  mcpTool,
  registerToolsWithServer,
  getOnchainWrite,
  getOnchainRead,
} from '@kasarlabs/ask-starknet-core';
import dotenv from 'dotenv';

import {
  depositEarnSchema,
  getSchema,
  getPositionsSchema,
  getTokensSchema,
  withdrawEarnSchema,
} from './schemas/index.js';
import { depositEarnPosition } from './tools/write/deposit_earn.js';
import { withdrawEarnPosition } from './tools/write/withdraw_earn.js';
import { getPools } from './tools/read/getPools.js';
import { getPositions } from './tools/read/getPositions.js';
import { getTokens } from './tools/read/getTokens.js';

dotenv.config();

const server = new McpServer({
  name: 'starknet-vesu-mcp',
  version: '0.0.1',
});

const registerTools = (VesuToolRegistry: mcpTool[]) => {
  VesuToolRegistry.push({
    name: 'deposit_earn',
    description: 'Deposit tokens to earn yield on Vesu protocol',
    schema: depositEarnSchema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await depositEarnPosition(onchainWrite, params);
    },
  });

  VesuToolRegistry.push({
    name: 'withdraw_earn',
    description: 'Withdraw tokens from earning position on Vesu protocol',
    schema: withdrawEarnSchema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await withdrawEarnPosition(onchainWrite, params);
    },
  });

  VesuToolRegistry.push({
    name: 'get_pools',
    description:
      'Retrieves all the pools in the protocol with their information, like assets, stats, configs on Vesu protocol',
    schema: getSchema,
    execute: async (params: any) => {
      const onchainRead = getOnchainRead();
      return await getPools(onchainRead, params);
    },
  });

  VesuToolRegistry.push({
    name: 'get_positions',
    description:
      'Retrieves positions for a given wallet address on Vesu protocol. Can filter by type (earn, borrow, multiply), max health factor, and rebalancing status',
    schema: getPositionsSchema,
    execute: async (params: any) => {
      const onchainRead = getOnchainRead();
      return await getPositions(onchainRead, params);
    },
  });

  VesuToolRegistry.push({
    name: 'get_tokens',
    description:
      'Retrieves all the supported tokens in Vesu UI. Can optionally filter by token address or symbol to check if a specific token is supported',
    schema: getTokensSchema,
    execute: async (params: any) => {
      const onchainRead = getOnchainRead();
      return await getTokens(onchainRead, params);
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
