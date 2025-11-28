# Starknet Knowledge MCP Server

A Model Context Protocol (MCP) server providing access to Starknet ecosystem knowledge and documentation via the Cairo Coder API.

## Quick Start

Use this MCP server directly with npx:

```bash
npx -y @kasarlabs/starknet-knowledge-mcp
```

## Configuration

The server supports two modes of operation:

### Mode 1: Public Cairo Coder API (Default)

Use the official Cairo Coder API with your API key.

**Environment Variables:**

- `CAIRO_CODER_API_KEY`: Your Cairo Coder API key (required)

**MCP Client Setup:**

```json
{
  "mcpServers": {
    "starknet-knowledge": {
      "command": "npx",
      "args": ["-y", "@kasarlabs/starknet-knowledge-mcp"],
      "env": {
        "CAIRO_CODER_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Mode 2: Local/Custom Endpoint

Use a local or custom Cairo Coder API endpoint (no API key required).

**Environment Variables:**

- `CAIRO_CODER_API_ENDPOINT`: Your local endpoint URL (e.g., "http://localhost:8000")

**MCP Client Setup:**

```json
{
  "mcpServers": {
    "starknet-knowledge": {
      "command": "npx",
      "args": ["-y", "@kasarlabs/starknet-knowledge-mcp"],
      "env": {
        "CAIRO_CODER_API_ENDPOINT": "http://localhost:8000"
      }
    }
  }
}
```

> **Note:** When using `CAIRO_CODER_API_ENDPOINT`, the server automatically switches to local mode and no API key is required or used.

## Available Tools

### starknet_general_knowledge

Get information about the Starknet ecosystem, protocols, and general knowledge.

**Parameters:**

- `query` (string, required): Your question about Starknet ecosystem
- `context` (string, optional): Additional context or specific topic area

**Examples:**

```typescript
// General ecosystem question
{
  "query": "What are the main DEXs on Starknet?"
}

// Specific protocol information
{
  "query": "How does AVNU handle token routing?",
  "context": "I'm building a swap aggregator"
}
```

## What You Can Learn About

- **Starknet Ecosystem**: Protocols, dApps, and services on Starknet
- **DeFi Protocols**: Information about DEXs, lending platforms, and yield farming
- **Technical Concepts**: Understanding of Starknet-specific features and technologies
- **Recent Updates**: Latest news and developments in the Starknet ecosystem
- **Best Practices**: Recommendations based on ecosystem standards

## Tips for Better Results

- Be specific about what aspect of the ecosystem you're interested in
- Mention specific protocols or concepts when relevant
- Provide context about your use case for more targeted responses
- Ask about recent developments or protocol comparisons

## Development

### Prerequisites

- Node.js >= 18
- npm or yarn

### Local Installation

```bash
git clone <repository-url>
cd ask-starknet/packages/mcps/starknet-knowledge
npm install
```

### Available Scripts

```bash
npm run build    # Build the project
npm run dev      # Start in development mode
npm start        # Start in production mode
```

## License

MIT

## Support

For issues and questions:

- GitHub Issues: [Create an issue](https://github.com/kasarlabs/ask-starknet/issues)
- MCP Documentation: [Model Context Protocol](https://modelcontextprotocol.io/)

## Contributing

Contributions are welcome! Please check the contribution guidelines before submitting a PR.
