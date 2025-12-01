#!/usr/bin/env node

import 'dotenv/config';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import packageJson from '../package.json' with { type: 'json' };
import {
  starknetGeneralKnowledgeSchema,
  type StarknetGeneralKnowledgeInput,
} from './schemas.js';

/**
 * Represents a message in the Cairo Coder conversation
 */
interface CairoCoderMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Request payload for the Cairo Coder API
 */
interface CairoCoderRequest {
  messages: CairoCoderMessage[];
}

/**
 * Response from the Cairo Coder API
 */
interface CairoCoderResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
  }>;
}

/**
 * MCP Server implementation for Cairo Coder API integration
 * Provides AI-powered assistance for Cairo and Starknet development
 */
class CairoCoderMCPServer {
  private server: McpServer;
  private apiKey: string;
  private apiUrl: string;
  private isLocalMode: boolean;

  /**
   * Initializes the Cairo Coder MCP Server
   * @throws {Error} If CAIRO_CODER_API_KEY environment variable is not set when using public API
   */
  constructor() {
    this.server = new McpServer({
      name: 'starknet-knowledge-mcp',
      version: packageJson.version,
    });

    // Check if local endpoint is specified
    const localEndpoint = process.env.CAIRO_CODER_API_ENDPOINT;

    if (localEndpoint) {
      // Local mode: use custom endpoint, no API key required
      this.isLocalMode = true;
      this.apiUrl = `${localEndpoint}/v1/chat/completions`;
      this.apiKey = '';
      console.error(
        `Starknet-knowledge MCP server configured for local mode: ${this.apiUrl}`
      );
    } else {
      // Public API mode: use official endpoint, API key required
      this.isLocalMode = false;
      this.apiUrl = 'https://api.cairo-coder.com/v1/chat/completions';
      this.apiKey = process.env.CAIRO_CODER_API_KEY || '';
      console.error(
        'Starknet-knowledge MCP server configured for public API mode'
      );
    }

    this.setupToolHandlers();
  }

  /**
   * Sets up the tool handlers for the MCP server
   * Configures both assist_with_cairo and starknet_general_knowledge tools
   */
  private setupToolHandlers(): void {
    this.server.tool(
      'starknet_general_knowledge',
      `Provides general knowledge about the Starknet ecosystem, protocol concepts, recent updates, and news.

Call this tool when the user needs to:
- **Understand Starknet concepts** (account abstraction, sequencers, STARK proofs, etc.)
- **Discover ecosystem projects** and integrations
- **Get information from the Starknet blog**
- **Understand high-level architecture** and design decisions

This tool has access to Starknet blog posts, conceptual documentation, and ecosystem information.`,
      starknetGeneralKnowledgeSchema.shape,
      async (args: StarknetGeneralKnowledgeInput) => {
        return await this.handleGeneralKnowledge(args);
      }
    );
  }

  /**
   * Handles general Starknet knowledge requests by calling the Cairo Coder API
   * @param args - The arguments containing query and optional conversation history
   * @returns The response from the Cairo Coder API or an error message
   */
  private async handleGeneralKnowledge(args: StarknetGeneralKnowledgeInput) {
    try {
      const { query, history } = args;

      if (!query) {
        throw new Error('Query parameter is required');
      }

      // Validate API key is available in public API mode
      if (!this.isLocalMode && !this.apiKey) {
        throw new Error(
          'CAIRO_CODER_API_KEY environment variable is required when using public API'
        );
      }

      // Add context to guide the backend towards general knowledge responses
      let contextualMessage = `As a Starknet ecosystem expert, answer the following question about Starknet concepts, or general knowledge:\n\n${query}`;

      if (history && history.length > 0) {
        contextualMessage = `Previous conversation context:\n${history.join('\n')}\n\nCurrent query: ${contextualMessage}`;
      }

      const requestBody: CairoCoderRequest = {
        messages: [
          {
            role: 'user',
            content: contextualMessage,
          },
        ],
      };

      // Prepare headers based on mode
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        mcp: 'true',
      };

      // Only add API key header in public API mode
      if (!this.isLocalMode && this.apiKey) {
        headers['x-api-key'] = this.apiKey;
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `API request failed: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const data = (await response.json()) as CairoCoderResponse;

      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response received from Cairo Coder API');
      }

      const assistantResponse = data.choices[0].message.content;

      return {
        content: [
          {
            type: 'text' as const,
            text: assistantResponse,
          },
        ],
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';

      return {
        content: [
          {
            type: 'text' as const,
            text: `Error: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Starts the MCP server with stdio transport
   * @throws {Error} If the server fails to start
   */
  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    console.error('Starknet-knowledge MCP server running on stdio');
    await this.server.connect(transport);

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }
}

/**
 * Main entry point for the application
 * Creates and starts the Cairo Coder MCP server
 */
async function main() {
  const server = new CairoCoderMCPServer();
  await server.run();
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});

export default CairoCoderMCPServer;
