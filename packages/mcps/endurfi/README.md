# Snak - Endurfi MCP

The Endurfi MCP provides tools for interacting with Endur Protocol, the leading liquid staking solution on Starknet that allows users to stake STRK tokens while maintaining liquidity through xSTRK tokens.

## About Endur Protocol

Endur is a liquid staking platform offering xSTRK, a tradeable Liquid Staking Token (LST) on Starknet. The protocol is backed by established teams STRKFarm and Karnot, with over 10,000 accounts actively liquid staking. Key features include:

- **Liquid Staking**: Stake STRK tokens while receiving tradeable xSTRK tokens
- **DeFi Integration**: Use xSTRK across various DeFi applications on Starknet
- **Competitive Fees**: 15% fee on staking rewards, 0% on deposits and withdrawals
- **Security**: Rigorous audit process ensuring protocol safety
- **Future Plans**: Bitcoin liquid staking coming to Starknet

## Features

This MCP adds the following tools:

### Read Operations

- **preview_stake**: Preview how much liquid staking token (xSTRK, xyWBTC, etc.) will be received for staking a given amount of underlying token (STRK, WBTC, tBTC, LBTC).
- **preview_unstake**: Preview how much underlying token (STRK, WBTC, tBTC, LBTC) will be received for unstaking a given amount of liquid staking token (xSTRK, xyWBTC, etc.).
- **get_user_balance**: Get user liquid staking token balance (xSTRK, xyWBTC, etc.) and its underlying token equivalent value for any token type.
- **get_total_staked**: Get total amount of underlying token (STRK, WBTC, tBTC, LBTC) staked on Endur.fi (TVL) for a specific token type.
- **get_withdraw_request_info**: Get information about a withdraw request NFT including status, amount, and claimability for any token type.
- **get_lst_stats**: Get liquid staking token statistics (APY, exchange rate, TVL) for all supported tokens on Endur.fi from the official API. Helps compare APY across different tokens to find the best yield.

### Write Operations

- **stake**: Stake tokens (STRK, WBTC, tBTC, LBTC) to receive liquid staking tokens (xSTRK, xyWBTC, etc.). No fees on staking. Rewards auto-compound.
- **unstake**: Unstake liquid staking tokens (xSTRK, xyWBTC, etc.) via the withdraw queue. Creates a withdraw request NFT. Wait 1-2 days before claiming. No slippage.
- **claim**: Claim underlying tokens (STRK, WBTC, tBTC, LBTC) from a withdraw request NFT after the waiting period (1-2 days).

## Usage

The Endurfi MCP is used by Claude Code and compatible MCP clients. Configure it in your MCP settings to enable Endur Protocol liquid staking functionality.

## Example

When asking the agent to perform Endur-related tasks, it will use the appropriate tool from this MCP:

```
"How much xSTRK will I get for staking 100 STRK?"  // Uses preview_stake
"How much STRK will I get for unstaking 50 xSTRK?"  // Uses preview_unstake
"Check my xSTRK balance"  // Uses get_user_balance
"What's the total STRK staked on Endur?"  // Uses get_total_staked
"Get APY for all tokens on Endur.fi"  // Uses get_lst_stats
"Compare APY between different tokens"  // Uses get_lst_stats
"Stake 100 STRK tokens on Endur"  // Uses stake
"Unstake 50 xSTRK tokens"  // Uses unstake
"Claim my tokens from withdraw request"  // Uses claim
"Check status of my withdraw request"  // Uses get_withdraw_request_info
```

## Development

To extend this MCP, add new tools in the `src/tools` directory and register them in the `registerTools` function in `src/tools/index.ts`.
