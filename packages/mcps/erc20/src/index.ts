#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import {
  mcpTool,
  registerToolsWithServer,
  getOnchainWrite,
} from '@ijusttookadnatest/ask-starknet-core';
import dotenv from 'dotenv';

import {
  getAllowanceSchema,
  getTotalSupplySchema,
  transferFromSchema,
  getBalanceSchema,
  getOwnBalanceSchema,
  approveSchema,
  transferSchema,
  getMyGivenAllowanceSchema,
  getAllowanceGivenToMeSchema,
  deployERC20Schema,
} from './schemas/index.js';

import { getAllowance } from './tools/getAllowance.js';
import { getTotalSupply } from './tools/getTotalSupply.js';
import { transferFrom } from './tools/transferFrom.js';
import { getBalance, getOwnBalance } from './tools/getBalance.js';
import { approve } from './tools/approve.js';
import { transfer } from './tools/transfer.js';
import { getMyGivenAllowance } from './tools/getAllowance.js';
import { getAllowanceGivenToMe } from './tools/getAllowance.js';
import { deployERC20Contract } from './tools/deployERC20.js';

dotenv.config();

const server = new McpServer({
  name: 'starknet-erc20-mcp',
  version: '0.0.1',
});

const registerTools = (Erc20ToolRegistry: mcpTool[]) => {
  Erc20ToolRegistry.push({
    name: 'erc20_get_allowance',
    description:
      'Get the amount of tokens that a spender is allowed to spend on behalf of an owner. Requires the token symbol (e.g., ETH, USDC), the owner address and the spender address.',
    schema: getAllowanceSchema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await getAllowance(onchainWrite as any, params);
    },
  });

  Erc20ToolRegistry.push({
    name: 'erc20_get_my_given_allowance',
    description:
      'Get the amount of tokens that a spender is allowed to spend on your behalf. Requires the token symbol (e.g., ETH, USDC) and the spender address.',
    schema: getMyGivenAllowanceSchema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await getMyGivenAllowance(onchainWrite as any, params);
    },
  });

  Erc20ToolRegistry.push({
    name: 'erc20_get_allowance_given_to_me',
    description:
      'Get the amount of tokens that a you are allowed to spend on the behalf of an owner. Requires the token symbol (e.g., ETH, USDC) and the owner address.',
    schema: getAllowanceGivenToMeSchema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await getAllowanceGivenToMe(onchainWrite as any, params);
    },
  });

  Erc20ToolRegistry.push({
    name: 'erc20_get_total_supply',
    description: 'Get the total supply of an token token',
    schema: getTotalSupplySchema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await getTotalSupply(onchainWrite as any, params);
    },
  });

  Erc20ToolRegistry.push({
    name: 'erc20_transfer_from',
    description:
      'Transfer tokens from one address to another using an allowance',
    schema: transferFromSchema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await transferFrom(onchainWrite as any, params);
    },
  });

  Erc20ToolRegistry.push({
    name: 'erc20_get_balance',
    description: 'Get the balance of an asset for a given wallet address',
    schema: getBalanceSchema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await getBalance(onchainWrite as any, params);
    },
  });

  Erc20ToolRegistry.push({
    name: 'erc20_get_own_balance',
    description: 'Get the balance of an asset in your wallet',
    schema: getOwnBalanceSchema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await getOwnBalance(onchainWrite as any, params);
    },
  });

  Erc20ToolRegistry.push({
    name: 'erc20_approve',
    description: 'Approve a spender to spend tokens on your behalf',
    schema: approveSchema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await approve(onchainWrite as any, params);
    },
  });

  Erc20ToolRegistry.push({
    name: 'erc20_transfer',
    description: 'Transfer ERC20 tokens to a specific address',
    schema: transferSchema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await transfer(onchainWrite as any, params);
    },
  });

  Erc20ToolRegistry.push({
    name: 'erc20_deploy_new_contract',
    description:
      'Create and deploy a new ERC20 contract, returns the address of the deployed contract',
    schema: deployERC20Schema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await deployERC20Contract(onchainWrite as any, params);
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
  console.error('Starknet ERC20 MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
