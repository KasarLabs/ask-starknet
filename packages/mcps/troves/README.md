# Snak - Troves Plugin

The Troves Plugin provides tools for fetching strategies from Troves API on Starknet.

## Features

This plugin adds the following tools:

- **troves_get_strategies**: Get all strategies from Troves API (https://app.troves.fi/api/strategies).

## Usage

The Troves Plugin is used internally by the Starknet Agent and doesn't need to be called directly. When the agent is initialized, it automatically registers these tools, making them available for use.

## Example

When asking the agent to perform Troves-related tasks, it will use the appropriate tool from this plugin:

```
"Get Troves strategies"  // Uses troves_get_strategies
"Show me available strategies on Troves"  // Uses troves_get_strategies
```

## Development

To extend this plugin, add new tools in the `src/tools` directory and register them in the `registerTools` function in `src/index.ts`.

