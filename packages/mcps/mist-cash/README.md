# Mist Cash MCP Server

MCP server for interacting with the Mist Cash protocol on Starknet.

## Overview

This MCP server provides tools to interact with the Mist Cash protocol, enabling privacy-preserving transactions on Starknet.

## Installation

```bash
npm install @kasarlabs/mist-cash-mcp
```

## Usage

### Configuration

Create a `.env` file with the following variables:

```env
STARKNET_RPC_URL=your_rpc_url
ACCOUNT_ADDRESS=your_account_address
PRIVATE_KEY=your_private_key
# Add other Mist Cash specific configuration
```

### Running the Server

```bash
npm run build
npm start
```

## Available Tools

### `mist_cash_example`

Example tool for Mist Cash protocol interaction.

**Parameters:**
- Add your parameters here

**Returns:**
- Add return value description

## Development

### Build

```bash
npm run build
```

### Clean

```bash
npm run clean
```

### Clean All (including node_modules)

```bash
npm run clean:all
```

## Implementation Guide

1. Define your schemas in `src/schemas/index.ts`
2. Implement your tools in `src/tools/`
3. Register your tools in `src/index.ts`
4. Add any interfaces in `src/interfaces/`
5. Add helper functions in `src/lib/`

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
