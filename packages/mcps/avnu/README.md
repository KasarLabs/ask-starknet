# Snak - AVNU Plugin

The AVNU Plugin provides tools for interacting with the AVNU decentralized exchange on the Starknet blockchain, enabling token swaps and route information.

## Features

This plugin adds the following tools:

- **avnu_swap_tokens**: Swap a specified amount of one token for another token.
- **avnu_get_route**: Get a specific routing path for a token swap.

### Token Identification

Both tools support identifying tokens by:

- **Symbol**: Use token symbols (e.g., `ETH`, `USDC`, `DAI`)
- **Address**: Use token contract addresses directly

You can mix and match - use a symbol for one token and an address for the other, or use addresses for both. For example:

- Use symbols for both: `{ sellTokenSymbol: "ETH", buyTokenSymbol: "USDC" }`
- Use addresses for both: `{ sellTokenAddress: "0x...", buyTokenAddress: "0x..." }`
- Mix them: `{ sellTokenSymbol: "ETH", buyTokenAddress: "0x..." }`

## Usage

The AVNU Plugin is used internally by the Starknet Agent and doesn't need to be called directly. When the agent is initialized, it automatically registers these tools, making them available for use.

## Example

When asking the agent to perform AVNU-related tasks, it will use the appropriate tool from this plugin:

```
"Swap 0.1 ETH for USDC on AVNU"  // Uses avnu_swap_tokens
"Find the best route to swap ETH to DAI"  // Uses avnu_get_route
```

## Development

To extend this plugin, add new tools in the `src/tools` directory and register them in the `registerTools` function in `src/tools/index.ts`.
