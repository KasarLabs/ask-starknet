import { z } from 'zod';

// Tool 1: Explain Architecture
export const explainArchitectureSchema = z.object({
  topic: z
    .enum(['router', 'mcps', 'interaction', 'all'])
    .optional()
    .describe(
      'Topic to explain: router (AI routing system and specialized agents), mcps (MCP servers structure), interaction (how agents and MCPs work together), or all'
    ),
});

// Tool 2: List Capabilities
export const listCapabilitiesSchema = z.object({
  domain: z
    .enum(['wallets', 'defi', 'blockchain', 'dev-tools', 'special', 'all'])
    .optional()
    .describe(
      'Filter by domain: wallets, defi, blockchain, dev-tools, special, or all'
    ),
  mcp: z
    .string()
    .optional()
    .describe('Filter by specific MCP name (e.g., "avnu", "erc20")'),
});

// Tool 3: Suggest Projects
export const suggestProjectsSchema = z.object({
  domain: z
    .enum([
      'defi',
      'nft',
      'trading',
      'automation',
      'analytics',
      'gaming',
      'all',
    ])
    .optional()
    .describe('Filter by project domain'),
  mcps: z
    .array(z.string())
    .optional()
    .describe(
      'Filter projects that use specific MCPs (e.g., ["avnu", "ekubo"])'
    ),
});

// Tool 4: Get Help
export const getHelpSchema = z.object({
  topic: z
    .enum(['quickstart', 'setup', 'capabilities', 'troubleshooting', 'all'])
    .optional()
    .describe(
      'Help topic: quickstart (basic usage), setup (configuration), capabilities (what Ask Starknet can do), troubleshooting (common issues), or all'
    ),
});
