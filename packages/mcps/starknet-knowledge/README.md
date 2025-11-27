<div align="center">
  <img src="./cairo-grey.png" alt="Cairo Coder MCP Logo" width="300"/>
  
  [![npm version](https://img.shields.io/npm/v/@kasarlabs/cairo-coder-mcp.svg)](https://www.npmjs.com/package/@kasarlabs/cairo-coder-mcp)
  [![npm downloads](https://img.shields.io/npm/dm/@kasarlabs/cairo-coder-mcp.svg)](https://www.npmjs.com/package/@kasarlabs/cairo-coder-mcp)
  [![GitHub stars](https://img.shields.io/github/stars/kasarlabs/cairo-coder-mcp.svg)](https://github.com/kasarlabs/cairo-coder-mcp/stargazers)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
</div>

# Cairo Coder MCP Server

A Model Context Protocol (MCP) server for Cairo and Starknet development assistance via the Cairo Coder API.

## Quick Start

Use this MCP server directly with npx:

```bash
npx -y @kasarlabs/cairo-coder-mcp
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
    "cairo-coder": {
      "command": "npx",
      "args": ["-y", "@kasarlabs/cairo-coder-mcp"],
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
    "cairo-coder": {
      "command": "npx",
      "args": ["-y", "@kasarlabs/cairo-coder-mcp"],
      "env": {
        "CAIRO_CODER_API_ENDPOINT": "http://localhost:8000"
      }
    }
  }
}
```

> **Note:** When using `CAIRO_CODER_API_ENDPOINT`, the server automatically switches to local mode and no API key is required or used.

## Available Tools

### assist_with_cairo

Get help with Cairo and Starknet development tasks.

**Parameters:**

- `query` (string, required): Your Cairo/Starknet development question
- `context` (string, optional): Additional context or code snippets

**Examples:**

```typescript
// Simple request
{
  "query": "Write a simple Cairo contract that implements a counter"
}

// With context
{
  "query": "How can I optimize this contract?",
  "context": "#[starknet::contract]\nmod Counter {\n    // existing code here\n}"
}
```

## What You Can Do

- **Write Cairo code**: Generate smart contracts and Cairo code
- **Refactor code**: Improve and optimize existing code
- **Implement features**: Complete TODOs and implement specific functionality
- **Learn Starknet**: Get contextual information about the Starknet ecosystem
- **Best practices**: Receive advice based on Cairo/Starknet documentation

## Tips for Better Results

- Use specific queries (e.g., "Using OpenZeppelin to build an ERC20" instead of just "ERC20")
- Include relevant code snippets when working with existing code
- Provide necessary context for more accurate responses

## Development

### Prerequisites

- Node.js >= 18
- npm or yarn

### Local Installation

```bash
git clone <repository-url>
cd cairo-coder-mcp
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

- GitHub Issues: [Create an issue](https://github.com/kasarlabs/cairo-coder-mcp/issues)
- MCP Documentation: [Model Context Protocol](https://modelcontextprotocol.io/)

## Contributing

Contributions are welcome! Please check the contribution guidelines before submitting a PR.
