#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import dotenv from 'dotenv';

import { mcpTool, registerToolsWithServer } from '@snaknet/core';
import { ExtendedApiEnv } from './lib/types/index.js';

// Import READ tools (Account Management)
import { getBalance } from './tools/read/getBalance.js';
import { getUserAccountInfo } from './tools/read/getUserAccountInfo.js';
import { getPositions } from './tools/read/getPositions.js';
import { getOpenOrders } from './tools/read/getOpenOrders.js';
import { getOrderById } from './tools/read/getOrderById.js';
import { getTradesHistory } from './tools/read/getTradesHistory.js';
import { getOrdersHistory } from './tools/read/getOrdersHistory.js';
import { getPositionsHistory } from './tools/read/getPositionsHistory.js';
import { getFundingPayments } from './tools/read/getFundingPayments.js';
import { getLeverage } from './tools/read/getLeverage.js';
import { getFees } from './tools/read/getFees.js';
import { getBridgeConfig } from './tools/read/getBridgeConfig.js';
import { getBridgeQuote } from './tools/read/getBridgeQuote.js';

// Import WRITE tools (Trading)
import { createLimitOrder } from './tools/write/createLimitOrder.js';
import { createMarketOrder } from './tools/write/createMarketOrder.js';
import { cancelOrder } from './tools/write/cancelOrder.js';
import { updateLeverage } from './tools/write/updateLeverage.js';
import { createWithdrawal } from './tools/write/createWithdrawal.js';
import { confirmBridgeQuote } from './tools/write/confirmBridgeQuote.js';

// Import schemas
import {
  GetBalanceSchema,
  GetUserAccountInfoSchema,
  GetPositionsSchema,
  GetOpenOrdersSchema,
  GetOrderByIdSchema,
  GetTradesHistorySchema,
  GetOrdersHistorySchema,
  GetPositionsHistorySchema,
  GetFundingPaymentsSchema,
  GetLeverageSchema,
  GetFeesSchema,
  GetBridgeConfigSchema,
  GetBridgeQuoteSchema,
  CreateLimitOrderSchema,
  CreateMarketOrderSchema,
  CancelOrderSchema,
  UpdateLeverageSchema,
  CreateWithdrawalSchema,
  ConfirmBridgeQuoteSchema
} from './schemas/index.js';

dotenv.config();

const server = new McpServer({
  name: 'extended-mcp',
  version: '0.0.1',
});

// Create API environment from environment variables
const createApiEnv = (): ExtendedApiEnv => {
  const apiKey = process.env.EXTENDED_API_KEY;
  const apiUrl = process.env.EXTENDED_API_URL || 'https://api.starknet.extended.exchange';
  const privateKey = process.env.EXTENDED_STARKKEY_PRIVATE;

  if (!apiKey) {
    throw new Error('EXTENDED_API_KEY environment variable is required');
  }

  return {
    apiKey,
    apiUrl,
    EXTENDED_STARKKEY_PRIVATE: privateKey,
  };
};

const registerTools = (env: ExtendedApiEnv, tools: mcpTool[]) => {
  // ========================================
  // READ TOOLS (Account Management)
  // ========================================

  tools.push({
    name: 'extended_get_balance',
    description: 'Get the current account balance including collateral, equity, available for trade, and unrealized PnL',
    schema: GetBalanceSchema,
    execute: async (params) => {
      return await getBalance(env, params);
    },
  });

  tools.push({
    name: 'extended_get_user_account_info',
    description: 'Get the current account details including status, account ID, L2 keys, vault information, and Starknet bridge address',
    schema: GetUserAccountInfoSchema,
    execute: async (params) => {
      return await getUserAccountInfo(env, params);
    },
  });

  tools.push({
    name: 'extended_get_positions',
    description: 'Get all currently open positions with details including size, PnL, liquidation price, and leverage',
    schema: GetPositionsSchema,
    execute: async (params) => {
      return await getPositions(env, params);
    },
  });

  tools.push({
    name: 'extended_get_open_orders',
    description: 'Get all currently open orders including limit and stop orders',
    schema: GetOpenOrdersSchema,
    execute: async (params) => {
      return await getOpenOrders(env, params);
    },
  });

  tools.push({
    name: 'extended_get_order_by_id',
    description: 'Get a specific order by its unique ID',
    schema: GetOrderByIdSchema,
    execute: async (params) => {
      return await getOrderById(env, params);
    },
  });

  tools.push({
    name: 'extended_get_trades_history',
    description: 'Get historical trades executed by the account with optional filters for market, time range, and limit',
    schema: GetTradesHistorySchema,
    execute: async (params) => {
      return await getTradesHistory(env, params);
    },
  });

  tools.push({
    name: 'extended_get_orders_history',
    description: 'Get historical orders (filled, canceled, or rejected) with optional filters',
    schema: GetOrdersHistorySchema,
    execute: async (params) => {
      return await getOrdersHistory(env, params);
    },
  });

  tools.push({
    name: 'extended_get_positions_history',
    description: 'Get historical closed positions with realized PnL',
    schema: GetPositionsHistorySchema,
    execute: async (params) => {
      return await getPositionsHistory(env, params);
    },
  });

  tools.push({
    name: 'extended_get_funding_payments',
    description: 'Get historical funding payments made or received for perpetual positions',
    schema: GetFundingPaymentsSchema,
    execute: async (params) => {
      return await getFundingPayments(env, params);
    },
  });

  tools.push({
    name: 'extended_get_leverage',
    description: 'Get current leverage settings for all markets',
    schema: GetLeverageSchema,
    execute: async (params) => {
      return await getLeverage(env, params);
    },
  });

  tools.push({
    name: 'extended_get_fees',
    description: 'Get the current fee schedule including maker, taker, and margin fees',
    schema: GetFeesSchema,
    execute: async (params) => {
      return await getFees(env, params);
    },
  });

  tools.push({
    name: 'extended_get_bridge_config',
    description: 'Get supported EVM chains and bridge contract addresses for cross-chain deposits/withdrawals',
    schema: GetBridgeConfigSchema,
    execute: async (params) => {
      return await getBridgeConfig(env);
    },
  });

  tools.push({
    name: 'extended_get_bridge_quote',
    description: 'Get a quote for bridging funds between EVM chains and Starknet. Returns quote ID and estimated fees.',
    schema: GetBridgeQuoteSchema,
    execute: async (params) => {
      return await getBridgeQuote(env, params);
    },
  });

  // ========================================
  // WRITE TOOLS (Trading)
  // ========================================

  tools.push({
    name: 'extended_create_limit_order',
    description: 'Create a new limit order with Starknet signature. Requires STARKNET_PRIVATE_KEY to be set. The order will be signed using Stark curve cryptography.',
    schema: CreateLimitOrderSchema,
    execute: async (params) => {
      return await createLimitOrder(env, params);
    },
  });

  tools.push({
    name: 'extended_create_market_order',
    description: 'Create a new market order with Starknet signature. Requires STARKNET_PRIVATE_KEY to be set. The order will be signed using Stark curve cryptography.',
    schema: CreateMarketOrderSchema,
    execute: async (params) => {
      return await createMarketOrder(env, params);
    },
  });

  tools.push({
    name: 'extended_cancel_order',
    description: 'Cancel an existing open order by its ID',
    schema: CancelOrderSchema,
    execute: async (params) => {
      return await cancelOrder(env, params);
    },
  });

  tools.push({
    name: 'extended_update_leverage',
    description: 'Update the leverage multiplier for a specific market',
    schema: UpdateLeverageSchema,
    execute: async (params) => {
      return await updateLeverage(env, params);
    },
  });

  tools.push({
    name: 'extended_create_withdrawal',
    description: 'Create a Starknet withdrawal. Requires STARKNET_PRIVATE_KEY to be set. WARNING: This implementation is incomplete - signature generation needs proper implementation following Extended SDK.',
    schema: CreateWithdrawalSchema,
    execute: async (params) => {
      return await createWithdrawal(env, params);
    },
  });

  tools.push({
    name: 'extended_confirm_bridge_quote',
    description: 'Confirm a bridge quote obtained from extended_get_bridge_quote. This tells Rhino.fi to start watching for the deposit transaction on the source chain.',
    schema: ConfirmBridgeQuoteSchema,
    execute: async (params) => {
      return await confirmBridgeQuote(env, params);
    },
  });
};

export const RegisterToolInServer = async () => {
  const env = createApiEnv();
  const tools: mcpTool[] = [];
  registerTools(env, tools);
  await registerToolsWithServer(server, tools);
};

async function main() {
  const transport = new StdioServerTransport();

  await RegisterToolInServer();
  await server.connect(transport);
  console.error('Extended MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
