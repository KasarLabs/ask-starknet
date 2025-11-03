#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import * as dotenv from 'dotenv';

import { mcpTool, registerToolsWithServer } from '@kasarlabs/ask-starknet-core';
import { explainArchitecture } from './tools/explainArchitecture.js';
import { listCapabilities } from './tools/listCapabilities.js';
import { suggestProjects } from './tools/suggestProjects.js';
import { getHelp } from './tools/getHelp.js';
import {
  explainArchitectureSchema,
  listCapabilitiesSchema,
  suggestProjectsSchema,
  getHelpSchema,
} from './schemas/index.js';

dotenv.config();

const server = new McpServer({
  name: 'ask-starknet-help-mcp',
  version: '0.1.0',
});

const registerTools = (DocsToolRegistry: mcpTool[]) => {
  DocsToolRegistry.push({
    name: 'ask_starknet_explain_architecture',
    description:
      'Explain the Ask Starknet architecture, unified router AI-powered routing, MCP servers structure, and how they interact together',
    schema: explainArchitectureSchema,
    execute: explainArchitecture,
  });

  DocsToolRegistry.push({
    name: 'ask_starknet_list_capabilities',
    description:
      'List all Ask Starknet capabilities organized by domains (wallets, DeFi, blockchain, dev-tools, special) with available MCPs and their tools',
    schema: listCapabilitiesSchema,
    execute: listCapabilities,
  });

  DocsToolRegistry.push({
    name: 'ask_starknet_suggest_projects',
    description:
      'Suggest project ideas that can be built with Ask Starknet, filtered by domain or required MCPs',
    schema: suggestProjectsSchema,
    execute: suggestProjects,
  });

  DocsToolRegistry.push({
    name: 'ask_starknet_help',
    description:
      'Get help on how to use Ask Starknet: quick start guide, setup instructions, capabilities overview, and troubleshooting',
    schema: getHelpSchema,
    execute: getHelp,
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
  console.error('Ask Starknet Help MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
