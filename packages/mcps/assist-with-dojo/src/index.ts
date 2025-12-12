#!/usr/bin/env node

import 'dotenv/config';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import packageJson from '../package.json' with { type: 'json' };
import { assistWithDojoSchema, type AssistWithDojoInput } from './schemas.js';

/**
 * Represents a message in the Dojo assistant conversation
 */
interface DojoAssistantMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Request payload for the Dojo assistant API
 */
interface DojoAssistantRequest {
  messages: DojoAssistantMessage[];
}

/**
 * Response from the Dojo assistant API
 */
interface DojoAssistantResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
  }>;
}

/**
 * MCP Server implementation for Dojo assistant API integration
 * Provides AI-powered assistance for Dojo development
 */
class DojoAssistantMCPServer {
  private server: McpServer;
  private apiKey: string;
  private apiUrl: string;
  private isLocalMode: boolean;

  /**
   * Initializes the Dojo Assistant MCP Server
   * @throws {Error} If CAIRO_CODER_API_KEY environment variable is not set when using public API
   */
  constructor() {
    this.server = new McpServer({
      name: 'assist-with-dojo-mcp',
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
        `Assist-with-dojo MCP server configured for local mode: ${this.apiUrl}`
      );
    } else {
      // Public API mode: use official endpoint, API key required
      this.isLocalMode = false;
      this.apiUrl = 'https://api.cairo-coder.com/v1/chat/completions';
      this.apiKey = process.env.CAIRO_CODER_API_KEY || '';
      console.error(
        'Assist-with-dojo MCP server configured for public API mode'
      );
    }

    this.setupToolHandlers();
  }

  /**
   * Sets up the tool handlers for the MCP server
   * Configures the assist-with-dojo tool
   */
  private setupToolHandlers(): void {
    this.server.tool(
      'assist-with-dojo',
      `Provides expert responses to queries about Dojo and all its components.

Call this tool when the user needs to:
- **Understand Dojo core concepts** and architecture
- **Work with Dojo components**: Katana (local development node), Torii (indexer), Sozo (CLI tool), Saya (settlement layer), Cainome (bindings generator)
- **Learn about Dojo SDKs**: dojo.js, dojo.c, dojo.unity, dojo.rust, dojo.godot, dojo.bevy, dojo.unreal
- **Use Dojo libraries**: Origami (game primitives) and Alexandria (standard library)
- **Build onchain games** with the Dojo framework
- **Deploy and manage** Dojo worlds and contracts

This tool has access to comprehensive Dojo documentation, component guides, SDK references, and library documentation.`,
      assistWithDojoSchema.shape,
      async (args: AssistWithDojoInput) => {
        return await this.handleDojoAssistance(args);
      }
    );
  }

  /**
   * Handles Dojo assistance requests by calling the Dojo assistant API
   * @param args - The arguments containing query and optional conversation history
   * @returns The response from the Dojo assistant API or an error message
   */
  private async handleDojoAssistance(args: AssistWithDojoInput) {
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

      // Add context to guide the backend towards Dojo-specific responses
      let contextualMessage = `As a Dojo expert, answer the following question:\n\n${query}`;

      if (history && history.length > 0) {
        contextualMessage = `Previous conversation context:\n${history.join('\n')}\n\nCurrent query: ${contextualMessage}`;
      }

      const requestBody: DojoAssistantRequest = {
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

      const data = (await response.json()) as DojoAssistantResponse;

      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response received from Dojo assistant API');
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
    console.error('AssistWithDojo server running on stdio');
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
 * Creates and starts the Dojo Assistant MCP server
 */
async function main() {
  const server = new DojoAssistantMCPServer();
  await server.run();
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});

export default DojoAssistantMCPServer;
