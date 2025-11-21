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

- `LAYERSWAP_API_KEY`: Your Layerswap API key (optional - for higher rate limits and analytics)
- `LAYERSWAP_API_URL`: Layerswap API base URL (optional, defaults to https://api.layerswap.io)

**Note:** No API key needed for basic usage. Get one at [layerswap.io/dashboard](https://layerswap.io/dashboard) for higher rate limits and analytics.

## Installation

```bash
npm install
npm run build
```

## Usage

```bash
npm start
```

