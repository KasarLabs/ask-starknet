#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import {
  mcpTool,
  registerToolsWithServer,
  getOnchainWrite,
  getOnchainRead,
} from '@ijusttookadnatest/core';
import dotenv from 'dotenv';

import {
  ownerOfSchema,
  transferFromSchema,
  getBalanceSchema,
  approveSchema,
  isApprovedForAllSchema,
  getApprovedSchema,
  safeTransferFromSchema,
  setApprovalForAllSchema,
  deployERC721Schema,
  getOwnBalanceSchema,
  transferSchema,
} from './schemas/index.js';
import { getOwner } from './tools/read/ownerOf.js';
import { transferFrom, transfer } from './tools/write/transferFrom.js';
import { getBalance } from './tools/read/balanceOf.js';
import { approve } from './tools/write/approve.js';
import { isApprovedForAll } from './tools/read/isApprovedForAll.js';
import { getApproved } from './tools/read/getApproved.js';
import { safeTransferFrom } from './tools/write/safeTransferFrom.js';
import { setApprovalForAll } from './tools/write/setApprovalForAll.js';
import { deployERC721Contract } from './tools/write/deployERC721.js';

dotenv.config();

const server = new McpServer({
  name: 'starknet-erc721-mcp',
  version: '0.0.1',
});

const registerTools = (Erc721ToolRegistry: mcpTool[]) => {
  Erc721ToolRegistry.push({
    name: 'erc721_owner_of',
    description: 'Get the owner of a specific NFT',
    schema: ownerOfSchema,
    execute: async (params: any) => {
      const onchainRead = getOnchainRead();
      return await getOwner(onchainRead as any, params);
    },
  });

  Erc721ToolRegistry.push({
    name: 'erc721_get_balance',
    description: 'Get the balance of NFTs for a given wallet address',
    schema: getBalanceSchema,
    execute: async (params: any) => {
      const onchainRead = getOnchainRead();
      return await getOwner(onchainRead as any, params);
    },
  });

  Erc721ToolRegistry.push({
    name: 'erc721_is_approved_for_all',
    description:
      'Check if an operator is approved for all NFTs of a given owner',
    schema: isApprovedForAllSchema,
    execute: async (params: any) => {
      const onchainRead = getOnchainRead();
      return await getOwner(onchainRead as any, params);
    },
  });

  Erc721ToolRegistry.push({
    name: 'erc721_get_approved',
    description: 'Get the approved address for a specific NFT ERC721',
    schema: getApprovedSchema,
    execute: async (params: any) => {
      const onchainRead = getOnchainRead();
      return await getOwner(onchainRead as any, params);
    },
  });

  Erc721ToolRegistry.push({
    name: 'erc721_transfer_from',
    description: 'Transfer a NFT from one address to another',
    schema: transferFromSchema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await transferFrom(onchainWrite as any, params);
    },
  });

  Erc721ToolRegistry.push({
    name: 'erc721_transfer',
    description: 'Transfer a NFT to a specific address',
    schema: transferSchema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await transfer(onchainWrite as any, params);
    },
  });

  Erc721ToolRegistry.push({
    name: 'erc721_approve',
    description: 'Approve an address to manage a specific NFT erc721',
    schema: approveSchema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await approve(onchainWrite as any, params);
    },
  });

  Erc721ToolRegistry.push({
    name: 'erc721_safe_transfer_from',
    description:
      'Safely transfer an NFT from one address to another with additional data',
    schema: safeTransferFromSchema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await safeTransferFrom(onchainWrite as any, params);
    },
  });

  Erc721ToolRegistry.push({
    name: 'erc721_set_approval_for_all',
    description:
      'Set or revoke approval for an operator to manage all NFTs of the caller',
    schema: setApprovalForAllSchema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await setApprovalForAll(onchainWrite as any, params);
    },
  });

  Erc721ToolRegistry.push({
    name: 'deploy_erc721',
    description:
      'Create and deploy a new ERC721 contract, returns the address of the deployed contract',
    schema: deployERC721Schema,
    execute: async (params: any) => {
      const onchainWrite = getOnchainWrite();
      return await deployERC721Contract(onchainWrite as any, params);
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
  console.error('Starknet ERC721 MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
