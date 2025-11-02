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
  depositSchema,
  withdrawSchema,
  checkDepositStatusSchema,
  checkWithdrawalReadySchema,
  listBridgedTokensSchema,
} from './schemas/index.js';
import { deposit } from './tools/deposit.js';
import { withdraw } from './tools/withdraw.js';
import { checkDepositStatus } from './tools/checkDepositStatus.js';
import { checkWithdrawalReady } from './tools/checkWithdrawalReady.js';
import { listBridgedTokens } from './tools/listBridgedTokens.js';

dotenv.config();

const server = new McpServer({
  name: 'starknet-starkgate-mcp',
  version: '0.0.1',
});

const registerTools = (StarkgateToolRegistry: mcpTool[]) => {
  StarkgateToolRegistry.push({
    name: 'starkgate_deposit',
    description:
      'Deposit tokens from Ethereum L1 to Starknet L2 using Starkgate bridge. Supports ETH and USDC. Requires ETHEREUM_PRIVATE_KEY and ETHEREUM_RPC_URL environment variables.',
    schema: depositSchema,
    execute: async (params: any) => {
      return await deposit(params);
    },
  });

  StarkgateToolRegistry.push({
    name: 'starkgate_withdraw',
    description:
      'Initiate withdrawal of tokens from Starknet L2 to Ethereum L1 using Starkgate bridge. After initiation, wait for block proof on L1 (few hours) then claim via Starkgate UI.',
    schema: withdrawSchema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await withdraw(onchainWrite as any, params);
    },
  });

  StarkgateToolRegistry.push({
    name: 'starkgate_check_deposit_status',
    description:
      'Check the status of a deposit from Ethereum L1 to Starknet L2. Verifies if the L1 transaction is confirmed and provides estimated arrival time on L2.',
    schema: checkDepositStatusSchema,
    execute: async (params: any) => {
      return await checkDepositStatus(params);
    },
  });

  StarkgateToolRegistry.push({
    name: 'starkgate_check_withdrawal_ready',
    description:
      'Check if a withdrawal from Starknet L2 to Ethereum L1 is ready to be claimed. Verifies L2 transaction status and provides estimated time until claimable on L1.',
    schema: checkWithdrawalReadySchema,
    execute: async (params: any) => {
      return await checkWithdrawalReady(params);
    },
  });

  StarkgateToolRegistry.push({
    name: 'starkgate_list_bridged_tokens',
    description:
      'List all tokens supported by Starkgate bridge with their L1/L2 addresses and bridge contract addresses.',
    schema: listBridgedTokensSchema,
    execute: async (params: any) => {
      return await listBridgedTokens(params);
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
  console.error('Starknet Starkgate MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
