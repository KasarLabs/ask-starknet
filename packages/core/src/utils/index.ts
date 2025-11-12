import { mcpTool, onchainRead, onchainWrite, McpToolResult } from '../interfaces/index.js';
import { Account, RpcProvider } from 'starknet';

/**
 * Register MCP tools with a server instance
 * @param server - The MCP server instance
 * @param tools - Array of mcpTool objects to register
 */
export const registerToolsWithServer = async (
  server: any,
  tools: mcpTool[]
): Promise<void> => {
  for (const tool of tools) {
    if (!tool.schema) {
      server.tool(tool.name, tool.description, async () => {
        const result = await tool.execute({});
        // Return result directly - it already follows MCP spec format
        return result;
      });
    } else {
      server.tool(
        tool.name,
        tool.description,
        tool.schema.shape,
        async (params: any) => {
          const result = await tool.execute(params);
          // Return result directly - it already follows MCP spec format
          return result;
        }
      );
    }
  }
};

/**
 * Format a successful MCP tool response following 2025-06-18 spec
 * @param message - Human-readable success message
 * @param data - Structured data to return
 * @returns McpToolResult with content and structuredContent
 */
export const returnMcpSuccess = (
  data: any
): McpToolResult => {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(data),
      },
    ],
    structuredContent: {
      status: 'success',
      ...data,
    },
  };
};

/**
 * Format a failed MCP tool response following 2025-06-18 spec
 * @param message - Human-readable error message
 * @param error - Error details
 * @param step - Optional step where error occurred
 * @returns McpToolResult with isError flag and error details
 */
export const returnMcpError = (
  message: string,
  error: string,
  step?: string
): McpToolResult => {
  return {
    isError: true,
    content: [
      {
        type: 'text',
        text: message,
      },
    ],
    structuredContent: {
      status: 'failure',
      error,
      ...(step && { step }),
    },
  };
};

export const getOnchainRead = (): onchainRead => {
  if (!process.env.STARKNET_RPC_URL) {
    throw new Error('Missing required environment variables: STARKNET_RPC_URL');
  }
  return {
    provider: new RpcProvider({ nodeUrl: process.env.STARKNET_RPC_URL }),
  };
};

export const getOnchainWrite = (): onchainWrite => {
  const rpcUrl = process.env.STARKNET_RPC_URL;
  const privateKey = process.env.STARKNET_PRIVATE_KEY;
  const accountAddress = process.env.STARKNET_ACCOUNT_ADDRESS;

  if (!rpcUrl || !privateKey || !accountAddress) {
    throw new Error(
      'Missing required environment variables: STARKNET_RPC_URL, STARKNET_PRIVATE_KEY, STARKNET_ACCOUNT_ADDRESS'
    );
  }

  const provider = new RpcProvider({ nodeUrl: rpcUrl });
  const account = new Account(provider, accountAddress, privateKey);

  return {
    provider,
    account,
  };
};
