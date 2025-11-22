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
  getNetworksSchema,
  getSourcesSchema,
  getDestinationsSchema,
  getSwapRouteLimitsSchema,
  getQuoteSchema,
  getDetailedQuoteSchema,
  getTransactionStatusSchema,
  getSwapDetailsSchema,
  getDepositActionsSchema,
  getAllSwapsSchema,
  createSwapSchema,
} from './schemas/index.js';
import { getNetworks } from './tools/read/getNetworks.js';
import { getSources } from './tools/read/getSources.js';
import { getDestinations } from './tools/read/getDestinations.js';
import { getSwapRouteLimits } from './tools/read/getSwapRouteLimits.js';
import { getQuote } from './tools/read/getQuote.js';
import { getDetailedQuote } from './tools/read/getDetailedQuote.js';
import { getTransactionStatus } from './tools/read/getTransactionStatus.js';
import { getSwapDetails } from './tools/read/getSwapDetails.js';
import { getDepositActions } from './tools/read/getDepositActions.js';
import { getAllSwaps } from './tools/read/getAllSwaps.js';
import { createSwap } from './tools/write/createSwap.js';
import { LayerswapApiClient } from './lib/utils/apiClient.js';

dotenv.config();

const server = new McpServer({
  name: 'starknet-layerswap-mcp',
  version: '0.1.0',
});

const getApiClient = (): LayerswapApiClient => {
  const apiKey =
    process.env.LAYERSWAP_API_KEY ||
    'bwDJw8c1mesRyWfO3WrOB7iE48xAkVEI5QWlgnNFHnwH/4W+zHOcRoM5D3Sne3eCXRqUzHTMXBt0hrd+lO4ASw';
  const apiUrl = process.env.LAYERSWAP_API_URL || 'https://api.layerswap.io';
  return new LayerswapApiClient(apiKey, apiUrl);
};

const registerTools = (LayerswapToolRegistry: mcpTool[]) => {
  const apiClient = getApiClient();

  LayerswapToolRegistry.push({
    name: 'get_networks',
    description: 'Get all available networks supported by Layerswap',
    schema: getNetworksSchema,
    execute: async (params: any) => {
      return await getNetworks(apiClient, params);
    },
  });

  LayerswapToolRegistry.push({
    name: 'get_sources',
    description: 'Get available sources for transfers',
    schema: getSourcesSchema,
    execute: async (params: any) => {
      return await getSources(apiClient, params);
    },
  });

  LayerswapToolRegistry.push({
    name: 'get_destinations',
    description: 'Get available destinations for transfers',
    schema: getDestinationsSchema,
    execute: async (params: any) => {
      return await getDestinations(apiClient, params);
    },
  });

  LayerswapToolRegistry.push({
    name: 'get_swap_route_limits',
    description: 'Get swap route limits for a specific source and destination',
    schema: getSwapRouteLimitsSchema,
    execute: async (params: any) => {
      return await getSwapRouteLimits(apiClient, params);
    },
  });

  LayerswapToolRegistry.push({
    name: 'get_quote',
    description: 'Get a quote for a specific swap',
    schema: getQuoteSchema,
    execute: async (params: any) => {
      return await getQuote(apiClient, params);
    },
  });

  LayerswapToolRegistry.push({
    name: 'get_detailed_quote',
    description: 'Get a detailed quote for a specific swap',
    schema: getDetailedQuoteSchema,
    execute: async (params: any) => {
      return await getDetailedQuote(apiClient, params);
    },
  });

  LayerswapToolRegistry.push({
    name: 'get_transaction_status',
    description: 'Get the status of a transaction',
    schema: getTransactionStatusSchema,
    execute: async (params: any) => {
      return await getTransactionStatus(apiClient, params);
    },
  });

  LayerswapToolRegistry.push({
    name: 'get_swap_details',
    description: 'Get details of a specific swap',
    schema: getSwapDetailsSchema,
    execute: async (params: any) => {
      return await getSwapDetails(apiClient, params);
    },
  });

  LayerswapToolRegistry.push({
    name: 'get_deposit_actions',
    description: 'Get deposit actions for a swap',
    schema: getDepositActionsSchema,
    execute: async (params: any) => {
      return await getDepositActions(apiClient, params);
    },
  });

  LayerswapToolRegistry.push({
    name: 'get_all_swaps',
    description:
      'Get all swaps for a specific destination address with optional pagination and expired swaps inclusion',
    schema: getAllSwapsSchema,
    execute: async (params: any) => {
      return await getAllSwaps(apiClient, params);
    },
  });

  LayerswapToolRegistry.push({
    name: 'create_swap',
    description: 'Create a new swap for cross-chain transfer',
    schema: createSwapSchema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await createSwap(apiClient, params, onchainWrite);
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
  console.error('Starknet Layerswap MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
