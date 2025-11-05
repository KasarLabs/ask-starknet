#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });
import { z } from 'zod';
import packageJson from '../package.json' with { type: 'json' };

import { graph } from './graph/graph.js';
import { logger } from './utils/logger.js';
import { HumanMessage } from '@langchain/core/messages';
import { getAllMcpInfo } from './graph/mcps/utilities.js';
import type { MCPServerInfo } from './graph/mcps/interfaces.js';

const performStarknetActionsSchema = z.object({
  userInput: z.string().describe('The actions that the user want to do'),
});
type performStarknetActionsInput = z.infer<typeof performStarknetActionsSchema>;
type envInput = {
  [key: string]: string | undefined;
};

export const performStarknetActions = async (
  env: envInput,
  input: performStarknetActionsInput
) => {
  logger.info('Graph execution started', { userInput: input.userInput });
  try {
    const config = { configurable: { thread_id: `user-${Date.now()}` } };

    const result = await graph.invoke(
      {
        messages: [new HumanMessage(input.userInput)],
        mcpEnvironment: env,
      },
      config
    );

    const finalMessage = result.messages[result.messages.length - 1];
    return {
      status: 'success',
      response: finalMessage.content,
    };
  } catch (error) {
    logger.error('Graph execution failed', error);
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

interface SnaknetTool<P = any> {
  name: string;
  description: string;
  schema?: z.AnyZodObject;
  execute: (env: envInput, input: P) => Promise<unknown>;
}

export const registerTools = (snaknetToolRegistry: SnaknetTool[]) => {
  snaknetToolRegistry.push({
    name: 'ask_starknet',
    description: 'Call ask-starknet agent to perform starknet actions',
    schema: performStarknetActionsSchema,
    execute: performStarknetActions,
  });
};

const server = new McpServer({
  name: 'ask-starknet-mcp',
  version: packageJson.version,
});

export const RegisterToolInServer = async (env: envInput) => {
  const tools: SnaknetTool[] = [];
  await registerTools(tools);
  for (const tool of tools) {
    if (!tool.schema) {
      server.tool(tool.name, tool.description, async () => {
        const result = await tool.execute(env, {});
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
        async (input: any, extra: any) => {
          const result = await tool.execute(env, input);
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

const LLM_API_KEYS = [
  'ANTHROPIC_API_KEY',
  'GEMINI_API_KEY',
  'OPENAI_API_KEY',
] as const;

// Default models for each LLM provider (centralized)
const DEFAULT_MODELS = {
  ANTHROPIC_API_KEY: 'claude-sonnet-4-20250514',
  GEMINI_API_KEY: 'gemini-2.5-flash',
  OPENAI_API_KEY: 'gpt-4o-mini',
} as const;

function validateRequiredEnvironmentVariables(): envInput {
  const env: envInput = {};
  const missingVars: string[] = [];

  const availableLLMKeys = LLM_API_KEYS.filter((key) => process.env[key]);
  if (availableLLMKeys.length === 0) {
    missingVars.push(
      'At least one LLM API key (ANTHROPIC_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY)'
    );
  } else {
    availableLLMKeys.forEach((key) => {
      env[key] = process.env[key];
    });

    if (process.env.MODEL_NAME) {
      env.MODEL_NAME = process.env.MODEL_NAME;
    } else {
      const primaryKey = availableLLMKeys[0];
      env.MODEL_NAME = DEFAULT_MODELS[primaryKey];
    }
  }

  // Build whitelist from mcps.json - only collect env vars needed by MCPs
  const mcpsConfig = getAllMcpInfo();
  const allowedEnvVars = new Set<string>();

  Object.values(mcpsConfig).forEach((mcpInfo: MCPServerInfo) => {
    if (mcpInfo.client.env) {
      Object.keys(mcpInfo.client.env).forEach((envVar) => {
        allowedEnvVars.add(envVar);
      });
    }
  });

  // Only collect whitelisted environment variables
  allowedEnvVars.forEach((key) => {
    if (process.env[key] && !env[key]) {
      env[key] = process.env[key];
    }
  });

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach((varName) => {
      console.error(`   - ${varName}`);
    });
    console.error(
      '\nPlease set at least one LLM API key before starting the MCP server.'
    );
    console.error('Example:');
    console.error(
      'export ANTHROPIC_API_KEY="sk-..." # or GEMINI_API_KEY or OPENAI_API_KEY'
    );
    console.error(
      'export MODEL_NAME="claude-sonnet-4" # optional, defaults based on API key provider'
    );
    process.exit(1);
  }

  console.error('✅ LLM API key(s) detected');
  availableLLMKeys.forEach((key) => {
    console.error(`   - ${key}: ***hidden***`);
  });
  console.error(`   - MODEL_NAME: ${env.MODEL_NAME}`);

  return env;
}

async function main() {
  const transport = new StdioServerTransport();
  const env = validateRequiredEnvironmentVariables();

  await RegisterToolInServer(env);
  await server.connect(transport);
  console.error('Ask-starknet MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
