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
  simulateInvokeTransaction,
  simulateDeployAccountTransaction,
  simulateDeployTransaction,
  simulateDeclareTransaction,
} from './tools/simulateTransaction.js';

import {
  simulateInvokeTransactionSchema,
  simulateDeployAccountTransactionSchema,
  simulateDeployTransactionSchema,
  simulateDeclareTransactionSchema,
} from './schemas/index.js';

dotenv.config();

const server = new McpServer({
  name: 'starknet-transaction-mcp',
  version: '0.0.1',
});

const registerTools = (TransactionToolRegistry: mcpTool[]) => {
  TransactionToolRegistry.push({
    name: 'simulate_transaction',
    description: 'Simulate a transaction without executing it',
    schema: simulateInvokeTransactionSchema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await simulateInvokeTransaction(onchainWrite as any, params);
    },
  });

  TransactionToolRegistry.push({
    name: 'simulate_deploy_transaction',
    description: 'Simulate Deploy transaction',
    schema: simulateDeployTransactionSchema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await simulateDeployTransaction(onchainWrite as any, params);
    },
  });

  TransactionToolRegistry.push({
    name: 'simulate_declare_transaction',
    description: 'Simulate Declare transaction',
    schema: simulateDeclareTransactionSchema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await simulateDeclareTransaction(onchainWrite as any, params);
    },
  });

  TransactionToolRegistry.push({
    name: 'simulate_deploy_account_transaction',
    description: 'Simulate Deploy Account transaction',
    schema: simulateDeployAccountTransactionSchema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await simulateDeployAccountTransaction(
        onchainWrite as any,
        params
      );
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
  console.error('Starknet Transaction MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
