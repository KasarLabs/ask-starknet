import { z } from 'zod';
import { Account, RpcProvider } from 'starknet';

export interface McpToolResult {
  content?: Array<{
    type: 'text';
    text: string;
  }>;
  structuredContent?: any;
  isError?: boolean;
}

export interface mcpTool {
  name: string;
  description: string;
  schema?: z.ZodObject<any>;
  outputSchema?: z.ZodObject<any>;
  execute: (params: any) => Promise<McpToolResult>;
}

export interface onchainRead {
  provider: RpcProvider;
}

export interface onchainWrite {
  provider: RpcProvider;
  account: Account;
}
