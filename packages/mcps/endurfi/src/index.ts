#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import dotenv from 'dotenv';

import {
  mcpTool,
  registerToolsWithServer,
  getOnchainRead,
  getOnchainWrite,
} from '@kasarlabs/ask-starknet-core';
import {
  stakeSchema,
  unstakeSchema,
  claimSchema,
  previewStakeSchema,
  previewUnstakeSchema,
  getUserBalanceSchema,
  getTotalStakedSchema,
  getWithdrawRequestInfoSchema,
  getLstStatsSchema,
} from './schemas/index.js';

import { stake } from './tools/write/stake.js';
import { unstake } from './tools/write/unstake.js';
import { claim } from './tools/write/claim.js';

import { previewStake } from './tools/read/previewStake.js';
import { previewUnstake } from './tools/read/previewUnstake.js';
import { getUserBalance } from './tools/read/getUserBalance.js';
import { getTotalStaked } from './tools/read/getTotalStaked.js';
import { getWithdrawRequestInfo } from './tools/read/getWithdrawRequestInfo.js';
import { getLstStats } from './tools/read/getLstStats.js';

dotenv.config();

const server = new McpServer({
  name: 'endurfi-mcp',
  version: '0.0.1',
});

const registerTools = (EndurfiToolRegistry: mcpTool[]) => {
  // Read operations
  EndurfiToolRegistry.push({
    name: 'preview_stake',
    description:
      'Preview how much liquid staking token (xSTRK, xyWBTC, etc.) will be received for staking a given amount of underlying token (STRK, WBTC, tBTC, LBTC)',
    schema: previewStakeSchema,
    execute: async (params: any) => {
      const onchainRead = getOnchainRead();
      return await previewStake(onchainRead, params);
    },
  });

  EndurfiToolRegistry.push({
    name: 'preview_unstake',
    description:
      'Preview how much underlying token (STRK, WBTC, tBTC, LBTC) will be received for unstaking a given amount of liquid staking token (xSTRK, xyWBTC, etc.)',
    schema: previewUnstakeSchema,
    execute: async (params: any) => {
      const onchainRead = getOnchainRead();
      return await previewUnstake(onchainRead, params);
    },
  });

  EndurfiToolRegistry.push({
    name: 'get_user_balance',
    description:
      'Get user liquid staking token balance (xSTRK, xyWBTC, etc.) and its underlying token equivalent value for any token type',
    schema: getUserBalanceSchema,
    execute: async (params: any) => {
      const onchainRead = getOnchainRead();
      return await getUserBalance(onchainRead, params);
    },
  });

  EndurfiToolRegistry.push({
    name: 'get_total_staked',
    description:
      'Get total amount of underlying token (STRK, WBTC, tBTC, LBTC) staked on Endur.fi (TVL) for a specific token type',
    schema: getTotalStakedSchema,
    execute: async (params: any) => {
      const onchainRead = getOnchainRead();
      return await getTotalStaked(onchainRead, params);
    },
  });

  EndurfiToolRegistry.push({
    name: 'get_withdraw_request_info',
    description:
      'Get information about a withdraw request NFT including status, amount, and claimability for any token type',
    schema: getWithdrawRequestInfoSchema,
    execute: async (params: any) => {
      const onchainRead = getOnchainRead();
      return await getWithdrawRequestInfo(onchainRead, params);
    },
  });

  EndurfiToolRegistry.push({
    name: 'get_lst_stats',
    description:
      'Get liquid staking token statistics (APY, exchange rate, TVL) for all supported tokens on Endur.fi from the official API',
    schema: getLstStatsSchema,
    execute: async (params: any) => {
      return await getLstStats(null, params);
    },
  });

  // Write operations
  EndurfiToolRegistry.push({
    name: 'stake',
    description:
      'Stake tokens (STRK, WBTC, tBTC, LBTC) to receive liquid staking tokens (xSTRK, xyWBTC, etc.). No fees on staking. Rewards auto-compound.',
    schema: stakeSchema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await stake(onchainWrite, params);
    },
  });

  EndurfiToolRegistry.push({
    name: 'unstake',
    description:
      'Unstake liquid staking tokens (xSTRK, xyWBTC, etc.) via the withdraw queue. Creates a withdraw request NFT. Wait 1-2 days before claiming. No slippage.',
    schema: unstakeSchema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await unstake(onchainWrite, params);
    },
  });

  EndurfiToolRegistry.push({
    name: 'claim',
    description:
      'Claim underlying tokens (STRK, WBTC, tBTC, LBTC) from a withdraw request NFT after the waiting period (1-2 days)',
    schema: claimSchema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await claim(onchainWrite, params);
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
  console.error('Starknet Endurfi MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
