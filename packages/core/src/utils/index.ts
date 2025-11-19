import { z } from 'zod';
import { mcpTool, onchainRead, onchainWrite } from '../interfaces/index.js';
import { Account, RpcProvider, constants } from 'starknet';

/**
 * Extract the base ZodObject schema from a ZodTypeAny, unwrapping ZodEffects if necessary
 * @param schema - The Zod schema (can be ZodObject or ZodEffects)
 * @returns The base ZodObject schema
 */
const extractBaseSchema = (schema: z.ZodTypeAny): z.ZodObject<any> => {
  // If it's already a ZodObject, return it
  if (schema instanceof z.ZodObject) {
    return schema;
  }

  // If it's a ZodEffects, unwrap it recursively
  if (schema instanceof z.ZodEffects) {
    return extractBaseSchema((schema as any)._def.schema);
  }

  // Fallback: try to access shape directly (for other Zod types)
  if ('shape' in schema) {
    return schema as z.ZodObject<any>;
  }

  throw new Error('Unable to extract base schema from provided Zod schema');
};

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
      const baseSchema = extractBaseSchema(tool.schema);
      server.tool(
        tool.name,
        tool.description,
        baseSchema.shape,
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
  const account = new Account({
    provider: provider,
    address: accountAddress,
    signer: privateKey,
  });

  return {
    provider,
    account,
  };
};
