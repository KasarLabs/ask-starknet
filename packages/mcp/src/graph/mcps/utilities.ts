import { readFileSync } from 'fs';
import { join } from 'path';
import {
  MCPServerInfo,
  MCPEnvironment,
  MCPClientConfig,
} from './interfaces.js';
import { logger } from '../../utils/logger.js';

function loadMcpsConfig(): Record<string, MCPServerInfo> {
  try {
    const configPath = join(process.cwd(), '../mcps/mcps.json');
    const configContent = readFileSync(configPath, 'utf-8');
    return JSON.parse(configContent);
  } catch (error) {
    console.error('Error loading mcps.json:', error);
    return {};
  }
}

export function getMcpInfo(name: string): MCPServerInfo | undefined {
  const config = loadMcpsConfig();
  return config[name];
}

export function getAllMcpInfo(): Record<string, MCPServerInfo> {
  return loadMcpsConfig();
}

export function getMcpNames(): string[] {
  const config = loadMcpsConfig();
  return Object.keys(config);
}

export const AvailableAgents = getMcpNames();
export type AgentName = (typeof AvailableAgents)[number];

export const getMCPClientConfig = (
  serverName: string,
  env?: MCPEnvironment
): MCPClientConfig => {
  const serverInfo = getMcpInfo(serverName);
  if (!serverInfo) {
    throw new Error(`MCP configuration not found for ${serverName}`);
  }

  const config = { ...serverInfo.client };

  // Construct the full path: ../mcps/{serverName}/{relativePath}
  if (config.args && config.args.length > 0) {
    config.args = config.args.map((arg) =>
      arg.includes('build/') ? `../mcps/${serverName}/${arg}` : arg
    );
  }

  if (env && serverInfo.client.env) {
    config.env = config.env || {};
    const missingVars: string[] = [];
    for (const envVar in serverInfo.client.env) {
      if (env[envVar]) {
        config.env[envVar] = env[envVar];
      } else {
        config.env[envVar] = '';
        missingVars.push(envVar);
      }
    }

    if (missingVars.length > 0) {
      throw new Error(
        `Missing environment variables for MCP '${serverName}': ${missingVars.join(', ')}\n` +
          `Available variables: ${Object.keys(env).join(', ')}\n` +
          `Required variables: ${Object.keys(serverInfo.client.env).join(', ')}`
      );
    }
  }
  return config;
};

export const getMCPDescription = (serverName: string): string => {
  return getMcpInfo(serverName)?.description || '';
};

export const getMCPPromptInfo = (
  serverName: string
): {
  agentName: string;
  expertise: string;
  tools: string[];
  description: string;
} => {
  const serverInfo = getMcpInfo(serverName);
  if (!serverInfo) {
    return {
      agentName: serverName,
      expertise: '',
      tools: [],
      description: '',
    };
  }
  return {
    agentName: serverName,
    expertise: serverInfo.promptInfo.expertise,
    tools: serverInfo.promptInfo.tools,
    description: serverInfo.description,
  };
};
