<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://github.com/KasarLabs/brand/blob/main/projects/snak/snak_logo_white_bg_alpha.png?raw=true">
    <img src="https://github.com/KasarLabs/brand/blob/main/projects/snak/snak_logo_black_bg_alpha.png?raw=true" width="100" alt="Ask Starknet Logo">
  </picture>

[![npm version](https://img.shields.io/npm/v/@kasarlabs/ask-starknet-mcp.svg)](https://www.npmjs.com/package/@kasarlabs/ask-starknet-mcp)
[![npm downloads](https://img.shields.io/npm/dm/@kasarlabs/ask-starknet-mcp.svg)](https://www.npmjs.com/package/@kasarlabs/ask-starknet-mcp)
[![GitHub stars](https://img.shields.io/github/stars/kasarlabs/ask-starknet.svg)](https://github.com/kasarlabs/ask-starknet/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

# Ask Starknet MCP Server

A unified Model Context Protocol (MCP) server that provides AI-powered routing to specialized Starknet MCP servers. Instead of manually selecting which MCP server to use, Ask Starknet intelligently analyzes your requests and routes them to the appropriate specialized server automatically.

## Quick Start

```bash
npx -y @kasarlabs/ask-starknet-mcp
```

## Configuration

### Required Environment Variables

**At least one LLM API key is required:**

- `ANTHROPIC_API_KEY`: Claude models (recommended)
- `GEMINI_API_KEY`: Google Gemini models
- `OPENAI_API_KEY`: OpenAI models

**Optional:**

- `MODEL_NAME`: Specify model (defaults: `claude-sonnet-4-20250514`, `gemini-2.5-flash`, or `gpt-4o-mini`)

### Optional MCP-Specific Environment Variables

Ask Starknet routes to specialized MCP servers based on your requests. **Only set the environment variables for the MCPs you want to use:**

#### For Blockchain Operations

- `STARKNET_RPC_URL`: Starknet RPC endpoint
- `STARKNET_ACCOUNT_ADDRESS`: Your account address (for signing transactions)
- `STARKNET_PRIVATE_KEY`: Your private key (for signing transactions)

Used by: **ERC20**, **ERC721**, **AVNU**, **Contract**, **Transaction**, **Ekubo**, **Endurfi**, **Fibrous**, **Opus**, **Unruggable**, **Vesu**

#### For Wallet Creation

- `STARKNET_RPC_URL`: Starknet RPC endpoint

Used by: **Argent**, **Braavos**, **OKX**, **OpenZeppelin**

#### For Blockchain Data Queries

- `STARKNET_RPC_URL`: Starknet RPC endpoint

Used by: **Starknet RPC**

#### For Perpetuals Trading

- `EXTENDED_API_KEY`: Your Extended API key
- `EXTENDED_API_URL`: Extended API endpoint
- `EXTENDED_PRIVATE_KEY`: Your Stark private key for Extended

Used by: **Extended**

#### For AI Development Assistant

- `CAIRO_CODER_API_KEY`: Your Cairo Coder API key

Used by: **Cairo Coder**

#### For Pixel Art

- `STARKNET_RPC_URL`, `STARKNET_ACCOUNT_ADDRESS`, `STARKNET_PRIVATE_KEY`
- `PATH_UPLOAD_DIR`: Upload directory path
- `SECRET_PHRASE`: Secret phrase for authentication

Used by: **Artpeace**

#### For Cairo Development

No additional environment variables needed for: **Scarb**

### MCP Client Setup

**Minimal setup** (LLM + read-only operations):

```json
{
  "mcpServers": {
    "ask-starknet": {
      "command": "npx",
      "args": ["-y", "@kasarlabs/ask-starknet-mcp"],
      "env": {
        "ANTHROPIC_API_KEY": "sk-...",
        "STARKNET_RPC_URL": "https://your-rpc-url"
      }
    }
  }
}
```

**With specialized MCPs** (e.g., you need Extended, Cairo Coder, ERC20 MCP...)

```json
{
  "mcpServers": {
    "ask-starknet": {
      "command": "npx",
      "args": ["-y", "@kasarlabs/ask-starknet-mcp"],
      "env": {
        "ANTHROPIC_API_KEY": "sk-...",
        "STARKNET_RPC_URL": "https://your-rpc-url",
        "STARKNET_ACCOUNT_ADDRESS": "0x...",
        "STARKNET_PRIVATE_KEY": "0x...",
        "EXTENDED_API_KEY": "your-extended-key",
        "EXTENDED_API_URL": "https://api.starknet.extended.exchange",
        "EXTENDED_PRIVATE_KEY": "0x...",
        "CAIRO_CODER_API_KEY": "your-cairo-coder-key"
      }
    }
  }
}
```

## Available Tool

### ask_starknet

Performs any Starknet-related action by intelligently routing to specialized MCP servers.

**Parameters:**

- `userInput` (string, required): Description of the Starknet action you want to perform

**Examples:**

```typescript
{ "userInput": "Transfer 100 USDC to 0x123..." }
{ "userInput": "Swap 1 ETH for USDC on AVNU" }
{ "userInput": "Open a long position on ETH/USD with 5x leverage on Extended" }
{ "userInput": "Transfer my NFT #42 from collection 0xabc... to 0xdef..." }
{ "userInput": "How do I implement an ERC20 token in Cairo?" }
```

## What You Can Do

Ask Starknet automatically routes your requests to the appropriate specialized MCP servers:

### Wallets & Accounts

- **Argent**, **Braavos**, **OKX**, **OpenZeppelin**: Create and deploy wallet accounts

### DeFi Protocols

- **AVNU**: DEX aggregator and token swaps
- **Ekubo**: Concentrated liquidity AMM, swaps, and liquidity provision
- **Endurfi**: Liquid staking (xSTRK, xyWBTC, xytBTC, xyLBTC)
- **Extended**: Perpetuals trading, derivatives, position management
- **Fibrous**: Multi-DEX swap routing for optimal prices
- **Opus**: Collateralized debt positions (Troves) and CASH borrowing
- **Vesu**: Lending, borrowing, and yield farming
- **Unruggable**: Memecoin creation and liquidity locking

### Blockchain Operations

- **ERC20**: Token transfers, approvals, balances, deployment
- **ERC721**: NFT transfers, approvals, metadata, deployment
- **Transaction**: Transaction simulation and management
- **Starknet RPC**: Blockchain data queries and on-chain information

### Development Tools

- **Scarb**: Cairo project initialization, compilation, execution, proving
- **Contract**: Smart contract declaration and deployment
- **Cairo Coder**: AI-powered Cairo development assistance and Starknet knowledge

### Special

- **Artpeace**: Collaborative pixel art on Starknet canvas

## How It Works

Ask Starknet uses an AI-powered routing system that:

1. Analyzes your natural language request
2. Determines which specialized MCP server(s) to use
3. Routes the request with appropriate parameters
4. Returns the result in a structured format

No need to remember which MCP server handles what - just describe what you want to do!

## License

MIT

## Support

- GitHub Issues: [Create an issue](https://github.com/kasarlabs/ask-starknet/issues)
- Documentation: [docs.kasar.io](https://docs.kasar.io)
- MCP Documentation: [Model Context Protocol](https://modelcontextprotocol.io/)
