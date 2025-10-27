#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import dotenv from 'dotenv';

import {
  mcpTool,
  registerToolsWithServer,
  getOnchainRead,
  getOnchainWrite,
} from '@ask-starknet/core';
import {
  poolKeySchema,
  getTokenPriceSchema,
  swapTokensSchema,
  addLiquiditySchema,
  withdrawLiquiditySchema,
  transferPositionSchema,
  createPositionSchema,
} from './schemas/index.js';

import { getPoolInfo } from './tools/read/getPoolInfo.js';
import { getTokenPrice } from './tools/read/getTokenPrice.js';
import { getPoolLiquidity } from './tools/read/getPoolLiquidity.js';
import { getPoolFeesPerLiquidity } from './tools/read/getPoolFeesPerLiquidity.js';

import { swap } from './tools/write/swap.js';
import { createPosition } from './tools/write/createPosition.js';
import { addLiquidity } from './tools/write/addLiquidity.js';
import { withdrawLiquidity } from './tools/write/withdrawLiquidity.js';
import { transferPosition } from './tools/write/transferPosition.js';

dotenv.config();

const server = new McpServer({
  name: 'ekubo-mcp',
  version: '0.0.1',
});

const registerTools = (EkuboToolRegistry: mcpTool[]) => {
  EkuboToolRegistry.push({
    name: 'get_pool_info',
    description:
      'Get comprehensive information about an Ekubo pool including current price, liquidity, and fee data.',
    schema: poolKeySchema,
    execute: async (params: any) => {
      const onchainRead = getOnchainRead();
      return await getPoolInfo(onchainRead, params);
    },
  });

  EkuboToolRegistry.push({
    name: 'get_token_price',
    description:
      'Get the price of a token via Ekubo pools by querying the pool price directly from the Core contract.',
    schema: getTokenPriceSchema,
    execute: async (params: any) => {
      const onchainRead = getOnchainRead();
      return await getTokenPrice(onchainRead, params);
    },
  });

  EkuboToolRegistry.push({
    name: 'get_pool_liquidity',
    description:
      'Get the total liquidity available in an Ekubo pool at the current tick.',
    schema: poolKeySchema,
    execute: async (params: any) => {
      const onchainRead = getOnchainRead();
      return await getPoolLiquidity(onchainRead, params);
    },
  });

  EkuboToolRegistry.push({
    name: 'get_pool_fees_per_liquidity',
    description:
      'Get the cumulative fees per unit of liquidity for an Ekubo pool (both token0 and token1).',
    schema: poolKeySchema,
    execute: async (params: any) => {
      const onchainRead = getOnchainRead();
      return await getPoolFeesPerLiquidity(onchainRead, params);
    },
  });

  // Write operations
  EkuboToolRegistry.push({
    name: 'swap',
    description:
      'Swap tokens on Ekubo DEX. Supports both exact input (specify input amount) and exact output (specify desired output amount) swaps with configurable slippage tolerance.',
    schema: swapTokensSchema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await swap(onchainWrite, params);
    },
  });

  EkuboToolRegistry.push({
    name: 'create_position',
    description:
      'Create a new liquidity position (NFT) in an Ekubo pool within a specified price range (concentrated liquidity). Mints a new NFT position.',
    schema: createPositionSchema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await createPosition(onchainWrite, params);
    },
  });

  EkuboToolRegistry.push({
    name: 'add_liquidity',
    description:
      'Add liquidity to an existing Ekubo pool position without minting a new NFT. Deposits tokens into the last position.',
    schema: addLiquiditySchema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await addLiquidity(onchainWrite, params);
    },
  });

  EkuboToolRegistry.push({
    name: 'withdraw_liquidity',
    description:
      'Withdraw liquidity from an Ekubo pool position. Can withdraw full position, partial position, or only collect fees.',
    schema: withdrawLiquiditySchema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await withdrawLiquidity(onchainWrite, params);
    },
  });

  EkuboToolRegistry.push({
    name: 'transfer_position',
    description:
      'Transfer an Ekubo NFT position to another address. The position NFT represents ownership of the liquidity position.',
    schema: transferPositionSchema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await transferPosition(onchainWrite, params);
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
  console.error('Starknet Ekubo MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
