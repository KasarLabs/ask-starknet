# StarkGate Bridge MCP

MCP server for StarkGate bridge operations between Ethereum L1 and Starknet L2.

## Features

- Bridge ETH and ERC20 tokens (USDC, USDT, WBTC, STRK) from Ethereum L1 to Starknet L2
- Bridge ETH and ERC20 tokens from Starknet L2 to Ethereum L1
- Automatic ERC20 token approval handling
- Token balance and allowance verification
- Secure environment variable-based configuration
- No private keys exposed in tool schemas

## Installation

```bash
pnpm install
pnpm build
```

## Configuration

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

### Required Environment Variables

#### For Starknet L2 Operations:

- `STARKNET_RPC_URL`: Your Starknet RPC endpoint
- `STARKNET_PRIVATE_KEY`: Your Starknet account private key
- `STARKNET_ACCOUNT_ADDRESS`: Your Starknet account address

#### For Ethereum L1 Operations:

- `ETHEREUM_RPC_URL`: Your Ethereum RPC endpoint
- `ETHEREUM_PRIVATE_KEY`: Your Ethereum wallet private key

## Available Tools

### bridge_l1_to_l2

Bridge ETH or ERC20 tokens from Ethereum L1 to Starknet L2.

**Parameters:**

- `l1chain` (string): The L1 chain to bridge from (e.g., "ethereum")
- `toAddress` (string): The Starknet address to receive the funds
- `amount` (string): The amount to bridge (in token units, e.g., "0.001" for ETH or "1.0" for USDC)
- `symbol` (string): Token symbol (ETH, USDC, USDT, WBTC, STRK)

**Supported Tokens:**
- ETH (18 decimals)
- USDC (6 decimals)
- USDT (6 decimals)
- WBTC (8 decimals)
- STRK (18 decimals)

**Example (ETH):**

```json
{
  "l1chain": "ethereum",
  "toAddress": "0x01fbe320049F84A38FbcB21B4Ae1a4aab89e4aB3c825d38d35202Ee873439E7D",
  "amount": "0.001",
  "symbol": "ETH"
}
```

**Example (USDC):**

```json
{
  "l1chain": "ethereum",
  "toAddress": "0x01fbe320049F84A38FbcB21B4Ae1a4aab89e4aB3c825d38d35202Ee873439E7D",
  "amount": "10.0",
  "symbol": "USDC"
}
```

**Note:** For ERC20 tokens, the bridge will automatically:
1. Check your token balance
2. Check current allowance for the bridge contract
3. Approve the bridge to spend tokens if needed (requires 1 transaction)
4. Execute the bridge deposit (requires 1 transaction)

### bridge_l2_to_l1

Bridge ETH or ERC20 tokens from Starknet L2 to Ethereum L1.

**Parameters:**

- `l1chain` (string): The L1 chain to bridge to (e.g., "ethereum")
- `toAddress` (string): The Ethereum address to receive the funds
- `amount` (string): The amount to withdraw (in token units, e.g., "0.001" for ETH or "1.0" for USDC)
- `symbol` (string): Token symbol (ETH, USDC, USDT, WBTC, STRK)

**Supported Tokens:**
- ETH (18 decimals)
- USDC (6 decimals)
- USDT (6 decimals)
- WBTC (8 decimals)
- STRK (18 decimals)

**Example (ETH):**

```json
{
  "l1chain": "ethereum",
  "toAddress": "0x8283a06f328eff7d505f475b0930260058066388",
  "amount": "0.001",
  "symbol": "ETH"
}
```

**Example (USDC):**

```json
{
  "l1chain": "ethereum",
  "toAddress": "0x8283a06f328eff7d505f475b0930260058066388",
  "amount": "10.0",
  "symbol": "USDC"
}
```

**Note:** L2 to L1 withdrawals typically take 4-12 hours to finalize on Ethereum due to Starknet's withdrawal mechanism.

## Security Notes

- Never commit your `.env` file to version control
- Private keys are loaded from environment variables only
- No sensitive data is exposed in tool schemas or logs
- Uses `onchainWrite` pattern from `@kasarlabs/ask-starknet-core`

## Development

```bash
# Build the project
pnpm build

# Clean build artifacts
pnpm clean

# Start the MCP server
pnpm start
```

## Architecture

This MCP follows the same pattern as other MCPs in the ask-starknet project:

- **Tools**: Bridge operation functions in [src/tools/bridgeTools.ts](src/tools/bridgeTools.ts)
- **Schemas**: Zod schemas for input validation in [src/schemas/](src/schemas/)
- **Utils**: Environment configuration helpers in [src/lib/utils.ts](src/lib/utils.ts)
- **Main**: MCP server setup in [src/index.ts](src/index.ts)

## License

MIT
