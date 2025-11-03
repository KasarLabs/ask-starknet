import { z } from 'zod';
import { explainArchitectureSchema } from '../schemas/index.js';

/**
 * Explain Ask Starknet architecture and how it works
 */
export const explainArchitecture = async (
  params: z.infer<typeof explainArchitectureSchema>
) => {
  try {
    const topic = params.topic || 'all';

    const architectureData = {
      overview:
        'Ask Starknet is a unified Model Context Protocol (MCP) server that provides AI-powered routing to specialized agents. Each specialized agent is connected to a specific MCP server and adds domain-specific context for proper tool selection. It eliminates the need to manually select which agent/MCP to use by intelligently analyzing user requests and routing them to the appropriate specialized agent.',

      unifiedRouter: {
        description:
          'The unified router is the core orchestration layer that receives user requests and intelligently routes them to the appropriate specialized agent.',
        howItWorks:
          'The AI-powered router analyzes natural language requests, determines which specialized agent is needed based on domain expertise, spawns the agent connected to the appropriate MCP server, provides domain context to help the agent select the right tool, and returns structured results.',
      },

      mcpServers: {
        description:
          'Specialized MCP servers are standalone packages that handle specific domains (wallets, DeFi protocols, blockchain operations, dev tools, etc.). Each server exposes a set of tools following a consistent pattern. Agents connect to these MCP servers to access their tools.',
        structure:
          'Each MCP server follows a standard structure: tools/ directory for individual tool implementations, schemas/ for input validation, lib/ for utilities and constants, and index.ts for server setup and tool registration.',
        toolFormat:
          'All tools define schemas for type-safe parameters, execute business logic and return JSON with {status: "success"|"failure", data?: any, error?: string} format.',
      },

      interaction: {
        description:
          'The interaction flow demonstrates how user requests flow through the system from initial input to final result via specialized agents.',
        flow: [
          '1. User makes a request (e.g., "Swap 1 ETH for USDC on AVNU")',
          '2. Unified router receives the request via the ask_starknet tool',
          '3. AI router analyzes the request to determine intent and required domain (e.g., "DeFi swapping")',
          '4. Router selects the appropriate specialized agent based on domain expertise (e.g., "AVNU DEX token swapping")',
          '5. Router spawns the specialized agent and connects it to the corresponding MCP server (e.g., AVNU MCP)',
          '6. Agent receives domain context and available tools from the MCP server',
          '7. Agent selects the appropriate tool based on the request (e.g., avnu_swap_tokens) and extracts parameters',
          '8. MCP server executes the tool logic (validates params, interacts with blockchain/APIs)',
          '9. Tool returns structured JSON response with status and data',
          '10. Agent formats the response and returns it through the router to the user',
        ],
      },
    };

    // Filter based on topic
    let responseData: any = {};

    if (topic === 'all') {
      responseData = architectureData;
    } else if (topic === 'router') {
      responseData = {
        overview: architectureData.overview,
        unifiedRouter: architectureData.unifiedRouter,
      };
    } else if (topic === 'mcps') {
      responseData = {
        overview: architectureData.overview,
        mcpServers: architectureData.mcpServers,
      };
    } else if (topic === 'interaction') {
      responseData = {
        overview: architectureData.overview,
        interaction: architectureData.interaction,
      };
    }

    return {
      status: 'success',
      data: responseData,
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
