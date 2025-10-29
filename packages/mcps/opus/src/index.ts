#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import {
  mcpTool,
  registerToolsWithServer,
  getOnchainWrite,
} from '@kasarlabs/ask-starknet-core';
import dotenv from 'dotenv';

import {
  borrowTroveSchema,
  collateralActionSchema,
  getTroveHealthSchema,
  getUserTrovesSchema,
  openTroveSchema,
  repayTroveSchema,
} from './schemas/index.js';
import { openTrove } from './tools/openTrove.js';
import {
  getBorrowFee,
  getTroveHealth,
  getUserTroves,
} from './tools/getters.js';
import { depositTrove } from './tools/depositTrove.js';
import { withdrawTrove } from './tools/withdrawTrove.js';
import { borrowTrove } from './tools/borrowTrove.js';
import { repayTrove } from './tools/repayTrove.js';

dotenv.config();

const server = new McpServer({
  name: 'starknet-opus-mcp',
  version: '0.0.1',
});

const registerTools = (OpusToolRegistry: mcpTool[]) => {
  OpusToolRegistry.push({
    name: 'open_trove',
    description: 'Open a Trove on Opus',
    schema: openTroveSchema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await openTrove(onchainWrite as any, params);
    },
  });

  OpusToolRegistry.push({
    name: 'get_user_troves',
    description: 'Get trove IDs for an address on Opus',
    schema: getUserTrovesSchema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await getUserTroves(onchainWrite as any, params);
    },
  });

  OpusToolRegistry.push({
    name: 'get_trove_health',
    description: 'Get the health of a trove on Opus',
    schema: getTroveHealthSchema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await getTroveHealth(onchainWrite as any, params);
    },
  });

  OpusToolRegistry.push({
    name: 'get_borrow_fee',
    description: 'Get the current borrow fee for Opus',
    execute: async () => {
      const onchainWrite = getOnchainWrite();
      return await getBorrowFee(onchainWrite as any);
    },
  });

  OpusToolRegistry.push({
    name: 'deposit_trove',
    description: 'Deposit collateral to a Trove on Opus',
    schema: collateralActionSchema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await depositTrove(onchainWrite as any, params);
    },
  });

  OpusToolRegistry.push({
    name: 'withdraw_trove',
    description: 'Withdraw collateral from a Trove on Opus',
    schema: collateralActionSchema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await withdrawTrove(onchainWrite as any, params);
    },
  });

  OpusToolRegistry.push({
    name: 'borrow_trove',
    description: 'Borrow CASH for a Trove on Opus',
    schema: borrowTroveSchema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await borrowTrove(onchainWrite as any, params);
    },
  });

  OpusToolRegistry.push({
    name: 'repay_trove',
    description: 'Repay CASH for a Trove on Opus',
    schema: repayTroveSchema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await repayTrove(onchainWrite as any, params);
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
  console.error('Starknet Opus MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
