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
  depositMultiplySchema,
  withdrawMultiplySchema,
  depositBorrowSchema,
  repayBorrowSchema,
} from './schemas/index.js';
import { depositEarnPosition } from './tools/write/deposit_earn.js';
import { withdrawEarnPosition } from './tools/write/withdraw_earn.js';
import { depositMultiplyPosition } from './tools/write/deposit_multiply.js';
import { withdrawMultiplyPosition } from './tools/write/withdraw_multiply.js';
import { depositBorrowPosition } from './tools/write/deposit_borrow.js';
import { repayBorrowPosition } from './tools/write/repay_borrow.js';
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
    name: 'deposit_multiply',
    description: 'Deposit collateral and borrow debt to create or increase a multiply position on Vesu protocol v2',
    schema: depositMultiplySchema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await depositMultiplyPosition(onchainWrite, params);
    },
  });

  VesuToolRegistry.push({
    name: 'withdraw_multiply',
    description: 'Withdraw collateral and repay debt to decrease or close a multiply position on Vesu protocol v2',
    schema: withdrawMultiplySchema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await withdrawMultiplyPosition(onchainWrite, params);
    },
  });

  VesuToolRegistry.push({
    name: 'deposit_borrow',
    description: 'Deposit collateral and borrow debt to create or increase a borrow position on Vesu protocol v2',
    schema: depositBorrowSchema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await depositBorrowPosition(onchainWrite, params);
    },
  });

  VesuToolRegistry.push({
    name: 'repay_borrow',
    description: 'Repay debt without withdrawing collateral to decrease debt in a borrow position on Vesu protocol v2',
    schema: repayBorrowSchema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await repayBorrowPosition(onchainWrite, params);
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
