import { z } from 'zod';
import { Account, RpcProvider } from 'starknet';

export interface mcpTool {
  name: string;
  description: string;
  schema?: z.ZodObject<any>;
  execute: (params: any) => Promise<any>;
}

export interface onchainRead {
  provider: RpcProvider;
}

export interface onchainWrite {
  provider: RpcProvider;
  account: Account;
}
