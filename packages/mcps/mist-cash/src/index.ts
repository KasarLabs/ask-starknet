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
  depositToChamberSchema,
  getChamberInfoSchema,
  withdrawFromChamberSchema,
} from './schemas/index.js';
import { depositToChamber } from './tools/deposit.js';
import { getChamberInfo } from './tools/getChamberInfo.js';
import { withdrawFromChamber } from './tools/withdraw.js';

dotenv.config();

const server = new McpServer({
  name: 'starknet-mist-cash-mcp',
  version: '0.1.0',
});

const registerTools = (MistCashToolRegistry: mcpTool[]) => {
  // Deposit to chamber tool
  MistCashToolRegistry.push({
    name: 'mist_cash_deposit',
    description: 'Deposit tokens into a Mist Cash chamber for private transactions. Generates a claiming key that can be used to withdraw the funds later.',
    schema: depositToChamberSchema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await depositToChamber(onchainWrite, params);
    },
  });

  // Get chamber info tool (read-only)
  MistCashToolRegistry.push({
    name: 'mist_cash_get_chamber_info',
    description: 'Get information about a chamber (deposited funds) using a claiming key and recipient address. Shows token, amount, and whether the transaction still exists in the merkle tree.',
    schema: getChamberInfoSchema,
    execute: async (params: any) => {
      const onchainRead = getOnchainRead();
      return await getChamberInfo(onchainRead, params);
    },
  });

  // Withdraw from chamber tool
  MistCashToolRegistry.push({
    name: 'mist_cash_withdraw',
    description: 'Withdraw tokens from a Mist Cash chamber using the claiming key. The tokens will be sent to the recipient address specified during deposit.',
    schema: withdrawFromChamberSchema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await withdrawFromChamber(onchainWrite, params);
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
  console.error('Starknet Mist Cash MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
