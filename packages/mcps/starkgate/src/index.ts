#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import {
  mcpTool,
  registerToolsWithServer,
  getOnchainWrite,
} from '@kasarlabs/ask-starknet-core';
import dotenv from 'dotenv';

import { bridgeL1toL2Schema, bridgeL2toL1Schema } from './schemas/index.js';

import { getEthereumWrite } from './lib/utils.js';
import { z } from 'zod';
import { bridgeL1toL2 } from './tools/bridgeL1toL2.js';
import { bridgeL2toL1 } from './tools/bridgeL2toL1.js';

dotenv.config();

const server = new McpServer({
  name: 'starkgate-mcp',
  version: '0.1.0',
});

const registerTools = (BridgeToolRegistry: any[]) => {
  BridgeToolRegistry.push({
    name: 'bridge_l1_to_l2',
    description: 'Bridge ERC20 from Ethereum L1 to Starknet L2',
    schema: bridgeL1toL2Schema,
    execute: async (params: any) => {
      console.error('Executing bridge_l1_to_l2 with params:', params);
      const ethEnv = getEthereumWrite();
      return await bridgeL1toL2(ethEnv, params);
    },
  });

  BridgeToolRegistry.push({
    name: 'bridge_l2_to_l1',
    description: 'Bridge ERC20 from Starknet L2 to Ethereum L1',
    schema: bridgeL2toL1Schema,
    execute: async (params: any) => {
      const starknetEnv = getOnchainWrite();
      return await bridgeL2toL1(starknetEnv, params);
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
  console.error('StarkGate Bridge MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
