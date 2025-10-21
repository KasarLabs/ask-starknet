import { mcpTool, onchainRead, onchainWrite } from '../interfaces/index.js';
import { Account, RpcProvider, constants } from 'starknet';

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
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result),
            },
          ],
        };
      });
    } else {
      server.tool(
        tool.name,
        tool.description,
        tool.schema.shape,
        async (params: any, extra: any) => {
          const result = await tool.execute(params);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result),
              },
            ],
          };
        }
      );
    }
  }
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
  const account = new Account(
    provider,
    accountAddress,
    privateKey
  );

  return {
    provider,
    account,
  };
};
