import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  MCPServerInfo,
  MCPEnvironment,
  MCPClientConfig,
} from './interfaces.js';
import { logger } from '../../utils/logger.js';

// ESM workaround for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadMcpsConfig(): Record<string, MCPServerInfo> {
  try {
    // mcps.json is at the root of the package
    // From build/graph/mcps/utilities.js -> ../../../mcps.json
    const configPath = join(__dirname, '../../../mcps.json');
    const configContent = readFileSync(configPath, 'utf-8');
    return JSON.parse(configContent);
  } catch (error) {
    console.error('Error loading mcps.json:', error);
    console.error('Tried path:', join(__dirname, '../../../mcps.json'));
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

  // Args are now npx package names, no path manipulation needed
  // The args already contain "@kasarlabs/{mcp-name}-mcp"

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
