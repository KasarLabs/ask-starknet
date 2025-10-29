#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import {
  mcpTool,
  registerToolsWithServer,
  getOnchainRead,
} from '@ijusttookadnatest/ask-starknet-core-test';
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
      const onchainRead = getOnchainRead();
      return await simulateInvokeTransaction(onchainRead as any, params);
    },
  });

  TransactionToolRegistry.push({
    name: 'simulate_deploy_transaction',
    description: 'Simulate Deploy transaction',
    schema: simulateDeployTransactionSchema,
    execute: async (params: any) => {
      const onchainRead = getOnchainRead();
      return await simulateDeployTransaction(onchainRead as any, params);
    },
  });

  TransactionToolRegistry.push({
    name: 'simulate_declare_transaction',
    description: 'Simulate Declare transaction',
    schema: simulateDeclareTransactionSchema,
    execute: async (params: any) => {
      const onchainRead = getOnchainRead();
      return await simulateDeclareTransaction(onchainRead as any, params);
    },
  });

  TransactionToolRegistry.push({
    name: 'simulate_deploy_account_transaction',
    description: 'Simulate Deploy Account transaction',
    schema: simulateDeployAccountTransactionSchema,
    execute: async (params: any) => {
      const onchainRead = getOnchainRead();
      return await simulateDeployAccountTransaction(onchainRead as any, params);
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
    console.error('Failed to initialize Transaction Server');
    process.exit(1);
  }

  await RegisterToolInServer();
  await server.connect(transport);
  console.error('Starknet Transaction MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
