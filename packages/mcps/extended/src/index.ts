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

// Import READ tools (Public Market Data)
import { getMarkets } from './tools/read/getMarkets.js';
import { getMarketStats } from './tools/read/getMarketStats.js';
import { getMarketOrderbook } from './tools/read/getMarketOrderbook.js';
import { getMarketTrades } from './tools/read/getMarketTrades.js';
import { getCandlesHistory } from './tools/read/getCandlesHistory.js';
import { getFundingRatesHistory } from './tools/read/getFundingRatesHistory.js';
// TODO: Re-enable when API fixes the 500 error
// import { getOpenInterestsHistory } from './tools/read/getOpenInterestsHistory.js';

// Import WRITE tools (Trading)
import { createLimitOrder } from './tools/write/createLimitOrder.js';
import { createLimitOrderWithTpSl } from './tools/write/createLimitOrderWithTpSl.js';
import { createMarketOrder } from './tools/write/createMarketOrder.js';
import { addPositionTpSl } from './tools/write/addPositionTpSl.js';
import { cancelOrder } from './tools/write/cancelOrder.js';
import { updateLeverage } from './tools/write/updateLeverage.js';

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
  GetMarketsSchema,
  GetMarketStatsSchema,
  GetMarketOrderbookSchema,
  GetMarketTradesSchema,
  GetCandlesHistorySchema,
  GetFundingRatesHistorySchema,
  // TODO: Re-enable when API fixes the 500 error
  // GetOpenInterestsHistorySchema,
  CreateLimitOrderSchema,
  CreateLimitOrderWithTpSlSchema,
  CreateMarketOrderSchema,
  AddPositionTpSlSchema,
  CancelOrderSchema,
  UpdateLeverageSchema,
} from './schemas/index.js';

dotenv.config();

const server = new McpServer({
  name: 'extended-mcp',
  version: '0.1.0',
});

// Create API environment from environment variables
const createApiEnv = (): ExtendedApiEnv => {
  const apiKey = process.env.EXTENDED_API_KEY;
  const apiUrl =
    process.env.EXTENDED_API_URL || 'https://api.starknet.extended.exchange';
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
    description:
      'Get the current account balance including collateral, equity, available for trade, and unrealized PnL',
    schema: GetBalanceSchema,
    execute: async (params) => {
      return await getBalance(env, params);
    },
  });

  tools.push({
    name: 'extended_get_user_account_info',
    description:
      'Get the current account details including status, account ID, L2 keys, vault information, and Starknet bridge address',
    schema: GetUserAccountInfoSchema,
    execute: async (params) => {
      return await getUserAccountInfo(env, params);
    },
  });

  tools.push({
    name: 'extended_get_positions',
    description:
      'Get all currently open positions with details including size, PnL, liquidation price, and leverage',
    schema: GetPositionsSchema,
    execute: async (params) => {
      return await getPositions(env, params);
    },
  });

  tools.push({
    name: 'extended_get_open_orders',
    description:
      'Get all currently open orders including limit and stop orders',
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
    description:
      'Get historical trades executed by the account with optional filters for market, time range, and limit',
    schema: GetTradesHistorySchema,
    execute: async (params) => {
      return await getTradesHistory(env, params);
    },
  });

  tools.push({
    name: 'extended_get_orders_history',
    description:
      'Get historical orders (filled, canceled, or rejected) with optional filters',
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
    description:
      'Get historical funding payments made or received for perpetual positions',
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
    description:
      'Get the current fee schedule including maker, taker, and margin fees',
    schema: GetFeesSchema,
    execute: async (params) => {
      return await getFees(env, params);
    },
  });

  tools.push({
    name: 'extended_get_bridge_config',
    description:
      'Get supported EVM chains and bridge contract addresses for cross-chain deposits/withdrawals',
    schema: GetBridgeConfigSchema,
    execute: async (params) => {
      return await getBridgeConfig(env);
    },
  });

  tools.push({
    name: 'extended_get_bridge_quote',
    description:
      'Get a quote for bridging funds between EVM chains and Starknet. Returns quote ID and estimated fees.',
    schema: GetBridgeQuoteSchema,
    execute: async (params) => {
      return await getBridgeQuote(env, params);
    },
  });

  // ========================================
  // READ TOOLS (Public Market Data)
  // ========================================

  tools.push({
    name: 'extended_get_markets',
    description:
      'Get list of available markets with configurations, trading statistics, and status. No authentication required.',
    schema: GetMarketsSchema,
    execute: async (params) => {
      return await getMarkets(env, params);
    },
  });

  tools.push({
    name: 'extended_get_market_stats',
    description:
      'Get latest trading statistics for a specific market including volume, price changes, funding rate, and open interest. No authentication required.',
    schema: GetMarketStatsSchema,
    execute: async (params) => {
      return await getMarketStats(env, params);
    },
  });

  tools.push({
    name: 'extended_get_market_orderbook',
    description:
      'Get current order book (bids and asks) for a specific market. No authentication required.',
    schema: GetMarketOrderbookSchema,
    execute: async (params) => {
      return await getMarketOrderbook(env, params);
    },
  });

  tools.push({
    name: 'extended_get_market_trades',
    description:
      'Get latest trades for a specific market showing price, quantity, side, and trade type. No authentication required.',
    schema: GetMarketTradesSchema,
    execute: async (params) => {
      return await getMarketTrades(env, params);
    },
  });

  tools.push({
    name: 'extended_get_candles_history',
    description:
      'Get historical OHLCV candles data for a market. Supports trades, mark prices, or index prices with customizable intervals. No authentication required.',
    schema: GetCandlesHistorySchema,
    execute: async (params) => {
      return await getCandlesHistory(env, params);
    },
  });

  tools.push({
    name: 'extended_get_funding_rates_history',
    description:
      'Get historical funding rates for a market. Funding rates are calculated every minute but applied hourly. No authentication required.',
    schema: GetFundingRatesHistorySchema,
    execute: async (params) => {
      return await getFundingRatesHistory(env, params);
    },
  });

  // TODO: Re-enable when API fixes the 500 error for this endpoint
  // tools.push({
  //   name: 'extended_get_open_interests_history',
  //   description: 'Get historical open interest data for a market in hourly or daily intervals. No authentication required.',
  //   schema: GetOpenInterestsHistorySchema,
  //   execute: async (params) => {
  //     return await getOpenInterestsHistory(env, params);
  //   },
  // });

  // ========================================
  // WRITE TOOLS (Trading)
  // ========================================

  tools.push({
    name: 'extended_create_limit_order',
    description:
      'Create a new limit order with Starknet signature. Allows setting a specific price and advanced options like post-only, time-in-force. Requires STARKNET_PRIVATE_KEY to be set.',
    schema: CreateLimitOrderSchema,
    execute: async (params) => {
      return await createLimitOrder(env, params);
    },
  });

  tools.push({
    name: 'extended_create_limit_order_with_tpsl',
    description:
      'Create a limit order with attached Take Profit and Stop Loss. TP/SL triggers are based on this specific order. Requires STARKNET_PRIVATE_KEY to be set.',
    schema: CreateLimitOrderWithTpSlSchema,
    execute: async (params) => {
      return await createLimitOrderWithTpSl(env, params);
    },
  });

  tools.push({
    name: 'extended_create_market_order',
    description:
      'Create a new market order with Starknet signature. Executes immediately at current market price with configurable slippage. Requires STARKNET_PRIVATE_KEY to be set.',
    schema: CreateMarketOrderSchema,
    execute: async (params) => {
      return await createMarketOrder(env, params);
    },
  });

  tools.push({
    name: 'extended_add_position_tpsl',
    description:
      'Add Take Profit and Stop Loss orders to an existing position. Used to manage risk on open positions. Requires STARKNET_PRIVATE_KEY to be set.',
    schema: AddPositionTpSlSchema,
    execute: async (params) => {
      return await addPositionTpSl(env, params);
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
