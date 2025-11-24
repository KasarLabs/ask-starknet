# Layerswap MCP

MCP server for Layerswap cross-chain bridge operations on Starknet.

## Features

This MCP provides tools for:

- Getting available networks
- Getting sources and destinations
- Getting swap route limits
- Getting quotes and detailed quotes
- Getting transaction status
- Getting swap details
- Getting deposit actions
- Getting all swaps
- Creating swaps

## Environment Variables

- `LAYERSWAP_API_KEY`: Your Layerswap API key (optional - a public API key is used by default)
- `LAYERSWAP_API_URL`: Layerswap API base URL (optional, defaults to https://api.layerswap.io)

**Note:** The package includes a public API key by default for basic usage. For production use with higher rate limits and analytics, set `LAYERSWAP_API_KEY` environment variable. Get your API key at [layerswap.io/dashboard](https://layerswap.io/dashboard).

## Installation

```bash
npm install
npm run build
```

## Usage

```bash
npm start
```
