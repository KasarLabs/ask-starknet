# Layerswap MCP

MCP server for Layerswap cross-chain bridge operations on Starknet. Layerswap enables seamless asset transfers between multiple blockchains including Ethereum, Starknet, Solana, Cosmos, and many others.

## About Layerswap

Layerswap is a cross-chain bridge protocol that allows users to transfer assets between different blockchain networks. It supports a wide range of networks including EVM chains, Starknet, Solana, Cosmos, StarkEx, zkSync Lite, TON, Paradex, Tron, Fuel, Bitcoin, and Hyperliquid.

## Features

This MCP provides **11 tools** for interacting with Layerswap:

### Read Operations

#### `get_networks`

Get all available networks supported by Layerswap.

**Parameters:**

- `network_types` (optional): Filter networks by type. Possible values: `evm`, `starknet`, `solana`, `cosmos`, `starkex`, `zksynclite`, `ton`, `paradex`, `tron`, `fuel`, `bitcoin`, `hyperliquid`

**Example:**

```
"Get all available networks on Layerswap"
"Show me all EVM networks supported by Layerswap"
```

#### `get_sources`

Get available sources (networks/tokens) for transfers. Useful for discovering what assets can be sent from.

**Parameters:**

- `destination_network` (optional): Filter by destination network name (e.g., `ETHEREUM_MAINNET`, `BASE_MAINNET`)
- `destination_token` (optional): Filter by destination token symbol (e.g., `ETH`)
- `include_swaps` (optional): Whether to include swaps in the response
- `include_unavailable` (optional): Whether to include unavailable sources
- `include_unmatched` (optional): Whether to include unmatched sources
- `has_deposit_address` (optional): Filter sources that have deposit addresses
- `network_types` (optional): Filter by network type array

**Example:**

```
"Get available sources for transferring to Starknet"
"What tokens can I send to Ethereum mainnet?"
```

#### `get_destinations`

Get available destinations (networks/tokens) for transfers. Useful for discovering where assets can be sent to.

**Parameters:**

- `source_network` (optional): Filter by source network name
- `source_token` (optional): Filter by source token symbol
- `include_swaps` (optional): Whether to include swaps in the response
- `include_unavailable` (optional): Whether to include unavailable destinations
- `include_unmatched` (optional): Whether to include unmatched destinations
- `network_types` (optional): Filter by network type array

**Example:**

```
"Get available destinations from Starknet"
"Where can I send ETH from Ethereum?"
```

#### `get_swap_route_limits`

Get swap route limits (minimum and maximum amounts) for a specific source and destination route.

**Parameters:**

- `source_network` (required): Source network name (e.g., `ETHEREUM_MAINNET`)
- `source_token` (required): Source token symbol (e.g., `ETH`)
- `destination_network` (required): Destination network name
- `destination_token` (required): Destination token symbol
- `use_deposit_address` (optional): Whether to use deposit address
- `refuel` (optional): Whether to include refuel

**Example:**

```
"Get swap limits for ETH from Ethereum to Starknet"
"What are the min and max amounts for USDC transfers from Base to Starknet?"
```

#### `get_quote`

Get a quote for a specific swap, including the amount you'll receive and estimated fees.

**Parameters:**

- `source_network` (required): Source network name
- `source_token` (required): Source token symbol
- `destination_network` (required): Destination network name
- `destination_token` (required): Destination token symbol
- `amount` (required): Amount to swap
- `source_address` (optional): Source address
- `slippage` (optional): Slippage tolerance in percentage format (e.g., `10` = 10%)
- `use_deposit_address` (optional): Whether to use deposit address
- `refuel` (optional): Whether to include refuel

**Example:**

```
"Get a quote for swapping 1 ETH from Ethereum to Starknet"
"How much USDC will I get if I swap 100 USDC from Base to Starknet?"
```

#### `get_detailed_quote`

Get a detailed quote for a specific swap with comprehensive information about the transfer.

**Parameters:**

- `source_network` (required): Source network name
- `source_token` (required): Source token symbol
- `destination_network` (required): Destination network name
- `destination_token` (required): Destination token symbol
- `use_deposit_address` (optional): Whether to use deposit address
- `refuel` (optional): Whether to include refuel
- `source_address` (optional): Source address
- `slippage` (optional): Slippage tolerance in percentage format

**Example:**

```
"Get a detailed quote for transferring ETH from Ethereum to Starknet"
"Show me detailed information about swapping USDC from Base to Starknet"
```

#### `get_transaction_status`

Get the status of a transaction on a specific network.

**Parameters:**

- `network` (required): Network name (e.g., `ETHEREUM_MAINNET`, `STARKNET_MAINNET`)
- `transaction_id` (required): Transaction ID to check status

**Example:**

```
"Check the status of transaction 0x123... on Ethereum"
"What's the status of my Starknet transaction?"
```

#### `get_swap_details`

Get details of a specific swap by its swap ID.

**Parameters:**

- `swap_id` (required): Swap ID (UUID) to get details
- `exclude_deposit_actions` (optional): Whether to exclude deposit actions from the response
- `source_address` (optional): Source address to filter swap details

**Example:**

```
"Get details for swap abc-123-def-456"
"Show me information about my swap"
```

#### `get_deposit_actions`

Get deposit actions for a swap. These are the on-chain transactions that need to be executed to initiate the swap.

**Parameters:**

- `swap_id` (required): Swap ID (UUID) to get deposit actions
- `source_address` (optional): Source address

**Example:**

```
"Get deposit actions for swap abc-123-def-456"
"What transactions do I need to execute for my swap?"
```

#### `get_all_swaps`

Get all swaps for a specific destination address with optional pagination.

**Parameters:**

- `address` (required): Destination address to retrieve swaps for
- `page` (optional): Page number for pagination
- `include_expired` (optional): Include expired swaps

**Example:**

```
"Get all my swaps for address 0x123..."
"Show me my swap history"
```

### Write Operations

#### `create_swap`

Create a new cross-chain swap via Layerswap and optionally execute the deposit transaction on-chain if the source address matches the environment account address.

**Parameters:**

- `destination_address` (required): Destination address where the swap will be received
- `source_network` (required): Source network name (e.g., `ETHEREUM_MAINNET`)
- `source_token` (required): Source token symbol (e.g., `ETH`)
- `destination_network` (required): Destination network name
- `destination_token` (required): Destination token symbol
- `amount` (required): Amount to swap in human decimal format (e.g., `1` = 1 ETH or 1 USDC)
- `refund_address` (required): Address to receive refunds if the swap fails
- `reference_id` (optional): Optional reference ID for tracking the swap
- `source_exchange` (optional): Source exchange name if applicable
- `destination_exchange` (optional): Destination exchange name if applicable
- `refuel` (optional): Whether to include refuel
- `use_deposit_address` (optional): Whether to use deposit address
- `use_new_deposit_address` (optional): Whether to use a new deposit address
- `source_address` (optional): Source address (defaults to environment account if available)
- `slippage` (optional): Slippage tolerance in percentage format (e.g., `10` = 10%)

**Note:** If a Starknet account is configured and the `source_address` matches the environment account address, the tool will automatically execute the deposit transaction on-chain and return the transaction hash in the response.

**Example:**

```
"Create a swap to transfer 1 ETH from Ethereum to Starknet"
"Swap 100 USDC from Base to Starknet, send to address 0x123..."
```

## Environment Variables

- `LAYERSWAP_API_KEY`: Your Layerswap API key (optional - a public API key is used by default)
- `LAYERSWAP_API_URL`: Layerswap API base URL (optional, defaults to `https://api.layerswap.io`)
- `STARKNET_RPC_URL`: Starknet RPC URL (required for on-chain operations)
- `STARKNET_PRIVATE_KEY`: Starknet private key (required for executing deposit transactions)

**Note:** The package includes a public API key by default for basic usage. For production use with higher rate limits and analytics, set `LAYERSWAP_API_KEY` environment variable. Get your API key at [layerswap.io/dashboard](https://layerswap.io/dashboard).

## Installation

```bash
pnpm install
pnpm run build
```

## Development

To extend this MCP, add new tools in the `src/tools` directory and register them in the `registerTools` function in `src/index.ts`.
