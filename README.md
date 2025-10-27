<div align="center">
  <img src="https://github.com/KasarLabs/brand/blob/main/projects/ask-starknet/ask_full_logo_grey_alpha.png?raw=true" width="200" alt="Ask Starknet Logo">
  <p><strong>Starknet's Model Context Protocol Server</strong></p>

<p>
<a href="https://www.npmjs.com/package/ask-starknet">
<img src="https://img.shields.io/npm/v/ask-starknet.svg" alt="NPM Version" />
</a>
<a href="https://github.com/kasarlabs/ask-starknet/blob/main/LICENSE">
<img src="https://img.shields.io/npm/l/ask-starknet.svg" alt="License" />
</a>
<a href="https://github.com/kasarlabs/ask-starknet/stargazers">
<img src="https://img.shields.io/github/stars/kasarlabs/ask-starknet.svg" alt="GitHub Stars" />
</a>
<a href="https://nodejs.org">
<img src="https://img.shields.io/node/v/ask-starknet.svg" alt="Node Version" />
</a>
</p>
</div>

A comprehensive collection of Model Context Protocol (MCP) servers for Starknet blockchain applications. This repository provides a unified Starknet MCP entrypoint that intelligently routes requests to specialized MCP servers, enabling AI applications to seamlessly interact with Starknet protocols, wallets, and DeFi applications.

## Table of Contents

- [What is MCP?](#what-is-mcp)
- [Quick Start](#quick-start)
- [Environment Configuration](#environment-configuration)
- [Usage](#usage)
- [Available MCP Servers](#available-mcp-servers)
- [Development](#development)
- [License](#license)

## What is MCP?

Model Context Protocol (MCP) is an open standard that enables AI applications to securely connect to external data sources and tools. MCP servers act as connectors between AI models and external services, providing structured access to blockchain data and operations.

## Quick Start

### Prerequisites

- Node.js 16+ and pnpm
- Starknet wallet credentials
- AI application that supports MCP (like Claude Desktop, etc.)

### Installation

```bash
git clone https://github.com/kasarlabs/ask-starknet.git
cd ask-starknet
pnpm install
pnpm build
```

## Environment Configuration

### Required Environment Variables

The Snaknet MCP requires **at least one LLM API key** to function:

```bash
# At least one of these is required
export ANTHROPIC_API_KEY="sk-..."     # For Claude models (recommended)
export GEMINI_API_KEY="..."           # For Google Gemini models
export OPENAI_API_KEY="sk-..."        # For OpenAI models

# Optional: specify model name (defaults based on API key provider)
export MODEL_NAME="claude-sonnet-4-20250514"
```

### Optional Environment Variables

Depending on which Starknet operations you want to perform, you may need additional environment variables. The router **dynamically loads all environment variables** and passes them to the appropriate MCPs as needed.

For example:

- `STARKNET_RPC_URL` - For interacting with Starknet blockchain
- `STARKNET_ACCOUNT_ADDRESS` - For transaction signing
- `STARKNET_PRIVATE_KEY` - For account operations

Simply add any environment variables required by the MCPs you want to use, and they will be automatically available to the router.

## Usage

### Using the Unified Starknet MCP Router (Recommended)

The Starknet MCP router provides a single entrypoint that automatically routes your requests to the appropriate specialized MCP server:

```bash
# Run the unified Starknet MCP router
cd packages/mcp
node build/index.js
```

The router uses an AI-powered graph to analyze your requests and route them to the most suitable MCP server (ERC20, AVNU, Argent, etc.) automatically.

### Running Individual MCP Servers

You can also run individual MCP servers directly:

```bash
# Run ERC20 MCP server
cd packages/mcps/erc20
node build/index.js

# Run Argent wallet MCP server
cd packages/mcps/argent
node build/index.js

# Run AVNU DEX MCP server
cd packages/mcps/avnu
node build/index.js
```

### Integration with AI Applications

#### Using the Unified Router (Recommended)

Configure your AI application to use the Starknet MCP router for automatic routing:

```json
{
  "mcpServers": {
    "ask-starknet": {
      "command": "node",
      "args": ["/path/to/ask-starknet/packages/mcp/build/index.js"],
      "env": {
        "STARKNET_ACCOUNT_ADDRESS": "your_address",
        "STARKNET_PRIVATE_KEY": "your_private_key",
        "STARKNET_RPC_URL": "your_rpc_url",
        "ANTHROPIC_API_KEY": "your_anthropic_api_key"
      }
    }
  }
}
```

#### Using Individual MCP Servers

You can also configure individual MCP servers directly:

```json
{
  "mcpServers": {
    "starknet-erc20": {
      "command": "node",
      "args": ["/path/to/ask-starknet/packages/mcps/erc20/build/index.js"],
      "env": {
        "STARKNET_ACCOUNT_ADDRESS": "your_address",
        "STARKNET_PRIVATE_KEY": "your_private_key",
        "STARKNET_RPC_URL": "your_rpc_url"
      }
    }
  }
}
```

### Example Use Cases

- **Token Management**: Transfer ERC20 tokens, check balances, approve spending
- **DeFi Operations**: Swap tokens, provide liquidity, borrow/lend assets
- **Perpetual Trading**: Trade derivatives, manage positions, execute limit/market orders on Extended
- **Wallet Management**: Create accounts, manage transactions, monitor balances
- **NFT Operations**: Transfer NFTs, manage collections, interact with marketplaces
- **Smart Contract Development**: Deploy contracts, interact with deployed contracts

## Available MCP Servers

### Wallet Management

- **Argent** - Argent X wallet integration
- **Braavos** - Braavos wallet integration
- **OpenZeppelin** - OpenZeppelin account integration
- **OKX** - OKX wallet integration

### DeFi Protocols

- **AVNU** - DEX aggregator and swap functionality
- **Ekubo** - Next-generation AMM with concentrated liquidity
- **Endurfi** - Liquid staking protocol (xSTRK, xyWBTC)
- **Extended** - High-performance perpetuals exchange for derivatives trading
- **Fibrous** - Token swap router finding optimal routes
- **Opus** - Collateralized debt positions (Troves) and CASH borrowing
- **Vesu** - Lending and earning protocol
- **Unruggable** - Memecoin creation and launch platform

### Core Blockchain Operations

- **ERC20** - Token operations (transfer, approve, balance, etc.)
- **ERC721** - NFT operations (transfer, approve, metadata, etc.)
- **Transaction** - Transaction management and monitoring
- **RPC** - Starknet RPC operations and blockchain data

### Development Tools

- **Scarb** - Cairo development, compilation, and proving tools
- **Contract** - Smart contract declaration and deployment

## Development

### Project Structure

```
packages/
├── core/            # Core utilities and shared functionality
├── mcp/             # Unified Starknet MCP router with AI-powered routing
└── mcps/            # Individual specialized MCP servers
    ├── argent/      # Argent wallet MCP server
    ├── avnu/        # AVNU DEX MCP server
    ├── braavos/     # Braavos wallet MCP server
    ├── contract/    # Contract declaration and deployment MCP server
    ├── ekubo/       # Ekubo AMM MCP server
    ├── endurfi/     # Endurfi liquid staking MCP server
    ├── erc20/       # ERC20 token MCP server
    ├── erc721/      # ERC721 NFT MCP server
    ├── extended/    # Extended Starknet operations MCP server
    ├── fibrous/     # Fibrous swap router MCP server
    ├── okx/         # OKX wallet MCP server
    ├── openzeppelin/ # OpenZeppelin account MCP server
    ├── opus/        # Opus lending and borrowing MCP server
    ├── scarb/       # Scarb development tools MCP server
    ├── starknet-rpc/ # Starknet RPC MCP server
    ├── transaction/ # Transaction management MCP server
    ├── unruggable/  # Unruggable memecoin MCP server
    └── vesu/        # Vesu lending and earning MCP server
```

### Adding New MCP Servers

Interested in contributing a new MCP server? Please see our [CONTRIBUTING.md](CONTRIBUTING.md) guide for detailed instructions on how to add new MCP servers to the ecosystem.

## License

MIT License - see the LICENSE file for details.

---

For detailed documentation visit [docs.kasar.io](https://docs.kasar.io)
