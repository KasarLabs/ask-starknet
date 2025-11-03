# Ask Starknet Docs MCP Server

Documentation and discovery MCP server for Ask Starknet. This MCP provides tools to explore Ask Starknet's architecture, capabilities, and project ideas.

## Features

- **Architecture Explanation**: Understand how Ask Starknet's unified router and MCP servers work together
- **Capabilities Listing**: Discover all available MCPs organized by domains (wallets, DeFi, blockchain, dev-tools, special)
- **Project Ideas**: Get inspired with project ideas that can be built using Ask Starknet

## Installation

```bash
npx -y @kasarlabs/ask-starknet-docs-mcp
```

## Available Tools

### 1. `ask_starknet_explain_architecture`

Explains the Ask Starknet architecture and how it works.

**Parameters:**
- `topic` (optional): `"router"` | `"mcps"` | `"interaction"` | `"all"`

**Example:**
```json
{
  "topic": "router"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "overview": "...",
    "unifiedRouter": {
      "description": "...",
      "howItWorks": "...",
      "technologies": [...]
    }
  }
}
```

### 2. `ask_starknet_list_capabilities`

Lists all Ask Starknet capabilities organized by domains.

**Parameters:**
- `domain` (optional): `"wallets"` | `"defi"` | `"blockchain"` | `"dev-tools"` | `"special"` | `"all"`
- `mcp` (optional): Filter by specific MCP name (e.g., `"avnu"`, `"erc20"`)

**Example:**
```json
{
  "domain": "defi"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "domains": {
      "defi": {
        "description": "...",
        "mcps": {
          "avnu": {
            "description": "...",
            "tools": [...],
            "expertise": "...",
            "toolCount": 2
          }
        }
      }
    },
    "statistics": {
      "totalMCPs": 20,
      "totalTools": 150,
      "mcpsByDomain": {...}
    }
  }
}
```

### 3. `ask_starknet_suggest_projects`

Suggests project ideas that can be built with Ask Starknet.

**Parameters:**
- `domain` (optional): `"defi"` | `"nft"` | `"trading"` | `"automation"` | `"analytics"` | `"gaming"` | `"all"`
- `mcps` (optional): Filter projects using specific MCPs (e.g., `["avnu", "ekubo"]`)

**Example:**
```json
{
  "domain": "defi",
  "mcps": ["avnu", "ekubo"]
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "projects": [
      {
        "name": "Multi-DEX Swap Aggregator",
        "description": "...",
        "domain": "defi",
        "requiredMCPs": ["avnu", "ekubo", "fibrous"],
        "features": [...]
      }
    ],
    "totalProjects": 5
  }
}
```

## Domains

Ask Starknet organizes MCPs into the following domains:

- **Wallets**: `argent`, `braavos`, `okx`, `openzeppelin`
- **DeFi**: `avnu`, `ekubo`, `endurfi`, `extended`, `fibrous`, `opus`, `vesu`, `unruggable`
- **Blockchain**: `erc20`, `erc721`, `transaction`, `starknet-rpc`, `contract`
- **Dev Tools**: `scarb`, `cairo-coder`
- **Special**: `artpeace`

## Development

### Build

```bash
pnpm install
pnpm build
```

The build process automatically generates `src/lib/mcpsData.ts` from the main `mcps.json` configuration.

### Update MCP Data

The MCP data is automatically generated from `packages/mcp/mcps.json` during the build process. To manually regenerate:

```bash
pnpm generate:mcps-data
```

## Architecture

This MCP is designed to be completely standalone with no blockchain dependencies. It uses:

- **Auto-generated data**: `mcpsData.ts` is generated from `packages/mcp/mcps.json` during build
- **Static project ideas**: Curated list of project ideas in `projectIdeas.ts`
- **Domain organization**: MCPs are organized by domain in `constants.ts`

## License

MIT

## Support

- GitHub Issues: [Create an issue](https://github.com/kasarlabs/ask-starknet/issues)
- Documentation: [docs.kasar.io](https://docs.kasar.io)
