import { z } from 'zod';
import { Account, RpcProvider } from 'starknet';

export interface toolResult {
  status: 'success' | 'failure';
  data?: Record<string, any> | Array<any>;
  error?: string;
}

export interface mcpTool {
  name: string;
  description: string;
  schema?: z.ZodObject<any>;
  outputSchema?: z.ZodObject<any>;
  execute: (params: any) => Promise<toolResult>;
}

export interface onchainRead {
  provider: RpcProvider;
}

export interface onchainWrite {
  provider: RpcProvider;
  account: Account;
}
