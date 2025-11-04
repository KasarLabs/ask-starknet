# Ask Starknet Capabilities

Ask Starknet provides comprehensive capabilities across multiple domains on the Starknet blockchain. All capabilities are accessed through natural language requests - no need to memorize tool names or parameters.

## Overview

Ask Starknet currently supports **21 specialized MCP servers** with **140+ tools** organized across 5 main domains:

- **Wallets** - 4 MCPs, 8 tools
- **DeFi** - 8 MCPs, 80+ tools
- **Blockchain** - 5 MCPs, 40+ tools
- **Dev Tools** - 3 MCPs, 12+ tools
- **Special** - 1 MCP, 1 tool

---

## Wallets & Account Management

Create, deploy, and manage various Starknet wallet types.

### Argent (`argent`)

**Description:** Management of Argent accounts on Starknet

**Tools:**

- `create_new_argent_account` - Create a new Argent wallet account
- `deploy_existing_argent_account` - Deploy an existing Argent account to the network

**Environment Variables:**

- `STARKNET_RPC_URL`

**Example Requests:**

- "Create a new Argent wallet"
- "Deploy my Argent account"

### Braavos (`braavos`)

**Description:** Management of Braavos wallet accounts on Starknet

**Tools:**

- `create_new_braavos_account` - Create a new Braavos wallet account
- `deploy_existing_braavos_account` - Deploy an existing Braavos account

**Environment Variables:**

- `STARKNET_RPC_URL`

**Example Requests:**

- "Create a new Braavos wallet"
- "Deploy my Braavos account to mainnet"

### OKX (`okx`)

**Description:** OKX wallet account creation and deployment on Starknet

**Tools:**

- `create_new_okx_account` - Create a new OKX wallet
- `deploy_existing_okx_account` - Deploy an OKX account

**Environment Variables:**

- `STARKNET_RPC_URL`

**Example Requests:**

- "Create an OKX wallet"
- "Deploy my OKX wallet account"

### OpenZeppelin (`openzeppelin`)

**Description:** OpenZeppelin account contract creation and deployment on Starknet

**Tools:**

- `create_new_openzeppelin_account` - Create a new OpenZeppelin account contract
- `deploy_existing_openzeppelin_account` - Deploy an OpenZeppelin account

**Environment Variables:**

- `STARKNET_RPC_URL`

**Example Requests:**

- "Create an OpenZeppelin account"
- "Deploy my OpenZeppelin account contract"

---

## DeFi Protocols

Comprehensive DeFi operations including swaps, liquidity provision, lending, staking, and derivatives trading.

### AVNU (`avnu`)

**Description:** AVNU decentralized exchange integration for token swaps on Starknet

**Tools:**

- `avnu_swap_tokens` - Execute token swaps through AVNU DEX aggregator
- `avnu_get_route` - Get the optimal swap route for a token pair

**Environment Variables:**

- `STARKNET_RPC_URL`
- `STARKNET_ACCOUNT_ADDRESS`
- `STARKNET_PRIVATE_KEY`

**Example Requests:**

- "Swap 100 USDC for ETH on AVNU"
- "Get the best route to swap STRK for USDT"

### Ekubo (`ekubo`)

**Description:** Ekubo decentralized exchange for liquidity management and token swaps

**Tools:**

- `get_pool_info` - Get information about a liquidity pool
- `get_pool_liquidity` - Get current liquidity in a pool
- `get_pool_fees_per_liquidity` - Get fees earned per liquidity unit
- `get_token_price` - Get current token price
- `swap` - Execute a token swap on Ekubo
- `create_position` - Create a new liquidity position
- `add_liquidity` - Add liquidity to an existing position
- `withdraw_liquidity` - Withdraw liquidity from a position
- `transfer_position` - Transfer a liquidity position to another address

**Environment Variables:**

- `STARKNET_RPC_URL`
- `STARKNET_ACCOUNT_ADDRESS`
- `STARKNET_PRIVATE_KEY`

**Example Requests:**

- "Show me liquidity in the ETH/USDC pool on Ekubo"
- "Add 1000 USDC liquidity to Ekubo"
- "What's the current price of STRK on Ekubo?"

### Fibrous (`fibrous`)

**Description:** Fibrous decentralized exchange for single and batch token swaps

**Tools:**

- `fibrous_swap` - Execute a single token swap
- `fibrous_batch_swap` - Execute multiple swaps in a single transaction
- `fibrous_get_route` - Get the optimal route for a swap

**Environment Variables:**

- `STARKNET_RPC_URL`
- `STARKNET_ACCOUNT_ADDRESS`
- `STARKNET_PRIVATE_KEY`

**Example Requests:**

- "Swap 50 ETH for USDC on Fibrous"
- "Batch swap: 100 USDC to ETH, 50 ETH to STRK"

### Opus (`opus`)

**Description:** Opus lending protocol for Trove management and borrowing

**Tools:**

- `open_trove` - Open a new Trove (collateralized debt position)
- `get_user_troves` - Get all Troves for a user
- `get_trove_health` - Check the health factor of a Trove
- `get_borrow_fee` - Get the current borrowing fee
- `deposit_trove` - Deposit collateral into a Trove
- `withdraw_trove` - Withdraw collateral from a Trove
- `borrow_trove` - Borrow CASH against collateral
- `repay_trove` - Repay borrowed CASH

**Environment Variables:**

- `STARKNET_RPC_URL`
- `STARKNET_ACCOUNT_ADDRESS`
- `STARKNET_PRIVATE_KEY`

**Example Requests:**

- "Open a Trove with 1000 USDC collateral"
- "Borrow 500 CASH from my Opus Trove"
- "Check my Trove health factor"
- "Repay 100 CASH to my Trove"

### Vesu (`vesu`)

**Description:** Vesu protocol for deposit and withdrawal operations for earning positions

**Tools:**

- `vesu_deposit_earn` - Deposit tokens to earn yield
- `vesu_withdraw_earn` - Withdraw tokens and accrued yield

**Environment Variables:**

- `STARKNET_RPC_URL`
- `STARKNET_ACCOUNT_ADDRESS`
- `STARKNET_PRIVATE_KEY`

**Example Requests:**

- "Deposit 1000 USDC to Vesu to earn yield"
- "Withdraw all my USDC from Vesu"

### Endurfi (`endurfi`)

**Description:** Endur.fi liquid staking protocol for STRK and BTC tokens (WBTC, tBTC, LBTC) on Starknet

**Tools:**

- `preview_stake` - Preview staking outcome before execution
- `preview_unstake` - Preview unstaking outcome
- `get_user_balance` - Get user's staked balance
- `get_total_staked` - Get total amount staked in protocol
- `get_withdraw_request_info` - Get withdrawal request status
- `stake` - Stake tokens to receive liquid staking tokens (xSTRK, xyWBTC, etc.)
- `unstake` - Request to unstake tokens
- `claim` - Claim unstaked tokens after cooldown period

**Environment Variables:**

- `STARKNET_RPC_URL`
- `STARKNET_ACCOUNT_ADDRESS`
- `STARKNET_PRIVATE_KEY`

**Example Requests:**

- "Stake 100 STRK on Endurfi"
- "Check my staked STRK balance"
- "Unstake 50 STRK from Endurfi"
- "Claim my unstaked tokens"

### Extended (`extended`)

**Description:** Extended high-performance perpetuals exchange on Starknet for trading derivatives with on-chain settlement

**Tools (Account & Position Management):**

- `extended_get_balance` - Get account balance
- `extended_get_user_account_info` - Get complete account information
- `extended_get_positions` - Get all open positions
- `extended_get_open_orders` - Get all active orders
- `extended_get_order_by_id` - Get specific order details
- `extended_get_trades_history` - Get trade history
- `extended_get_orders_history` - Get order history
- `extended_get_positions_history` - Get positions history
- `extended_get_funding_payments` - Get funding payment history
- `extended_get_leverage` - Get current leverage settings
- `extended_get_fees` - Get fee information

**Tools (Market Data):**

- `extended_get_markets` - Get all available markets
- `extended_get_market_stats` - Get market statistics
- `extended_get_market_orderbook` - Get market order book
- `extended_get_market_trades` - Get recent trades for a market
- `extended_get_candles_history` - Get price candles/OHLCV data
- `extended_get_funding_rates_history` - Get funding rate history

**Tools (Trading):**

- `extended_create_limit_order` - Create a limit order
- `extended_create_limit_order_with_tpsl` - Create limit order with take-profit/stop-loss
- `extended_create_market_order` - Create a market order
- `extended_add_position_tpsl` - Add TP/SL to existing position
- `extended_cancel_order` - Cancel an open order
- `extended_update_leverage` - Update leverage settings

**Tools (Bridge):**

- `extended_get_bridge_config` - Get bridge configuration
- `extended_get_bridge_quote` - Get bridge quote for deposits/withdrawals

**Environment Variables:**

- `EXTENDED_API_KEY`
- `EXTENDED_API_URL`
- `EXTENDED_PRIVATE_KEY`

**Example Requests:**

- "Open a 5x long position on ETH/USD with $1000"
- "Check my open positions on Extended"
- "Set stop-loss at $3000 for my ETH position"
- "Get ETH/USD market stats"
- "Cancel my pending order #12345"

### Unruggable (`unruggable`)

**Description:** Memecoin creation and analysis with focus on safer token launches

**Tools:**

- `is_memecoin` - Check if a token is a memecoin
- `get_locked_liquidity` - Get locked liquidity information
- `create_memecoin` - Create a new memecoin
- `launch_on_ekubo` - Launch memecoin on Ekubo with liquidity

**Environment Variables:**

- `STARKNET_RPC_URL`
- `STARKNET_ACCOUNT_ADDRESS`
- `STARKNET_PRIVATE_KEY`

**Example Requests:**

- "Create a memecoin called DOGE with 1M supply"
- "Launch my memecoin on Ekubo with 1000 USDC liquidity"
- "Check if token 0x123... is a memecoin"

---

## Blockchain Operations

Core blockchain interactions including token operations, NFTs, transactions, and smart contracts.

### ERC20 (`erc20`)

**Description:** Management of ERC20 operations (transfer, balance, deployment) on Starknet

**Tools:**

- `erc20_get_allowance` - Get token allowance between addresses
- `erc20_get_my_given_allowance` - Get allowances you've given
- `erc20_get_allowance_given_to_me` - Get allowances given to you
- `erc20_get_total_supply` - Get token total supply
- `erc20_transfer_from` - Transfer tokens from another address (with allowance)
- `erc20_get_own_balance` - Get your token balance
- `erc20_get_balance` - Get any address's token balance
- `erc20_approve` - Approve token spending
- `erc20_transfer` - Transfer tokens
- `erc20_deploy_new_contract` - Deploy a new ERC20 token

**Environment Variables:**

- `STARKNET_RPC_URL`
- `STARKNET_ACCOUNT_ADDRESS`
- `STARKNET_PRIVATE_KEY`

**Example Requests:**

- "Check my ETH balance"
- "Transfer 100 USDC to 0x123..."
- "Approve AVNU to spend 500 USDC"
- "Deploy a new ERC20 token called MyToken"

### ERC721 (`erc721`)

**Description:** Comprehensive ERC721 NFT operations on Starknet

**Tools:**

- `erc721_owner_of` - Get NFT owner
- `erc721_get_balance` - Get NFT balance for an address
- `erc721_is_approved_for_all` - Check operator approval status
- `erc721_get_approved` - Get approved address for an NFT
- `erc721_transfer_from` - Transfer NFT from another address
- `erc721_transfer` - Transfer your NFT
- `erc721_approve` - Approve NFT transfer
- `erc721_safe_transfer_from` - Safe transfer with receiver check
- `erc721_set_approval_for_all` - Set operator approval
- `deploy_erc721` - Deploy a new ERC721 collection

**Environment Variables:**

- `STARKNET_RPC_URL`
- `STARKNET_ACCOUNT_ADDRESS`
- `STARKNET_PRIVATE_KEY`

**Example Requests:**

- "Transfer my NFT #42 to 0x456..."
- "Check who owns NFT #123 from collection 0xabc..."
- "Deploy a new NFT collection called MyNFTs"

### Starknet RPC (`starknet-rpc`)

**Description:** Direct blockchain interaction via RPC methods for on-chain data access

**Tools:**

- `get_chain_id` - Get Starknet chain ID
- `get_syncing_status` - Get node syncing status
- `get_class_hash` - Get contract class hash
- `get_spec_version` - Get spec version
- `get_block_with_tx_hashes` - Get block with transaction hashes
- `get_block_with_receipts` - Get block with transaction receipts
- `get_transaction_status` - Get transaction status
- `get_block_number` - Get latest block number
- `get_block_transaction_count` - Get transaction count in a block
- `get_storage_at` - Get contract storage value
- `get_class` - Get contract class definition
- `get_class_at` - Get class at specific address

**Environment Variables:**

- `STARKNET_RPC_URL`

**Example Requests:**

- "What's the latest block number on Starknet?"
- "Get the transaction status for 0xabc..."
- "Check if the node is syncing"

### Transaction (`transaction`)

**Description:** Transaction simulation tools for Starknet

**Tools:**

- `simulate_transaction` - Simulate a transaction before execution
- `simulate_deploy_transaction` - Simulate contract deployment
- `simulate_declare_transaction` - Simulate contract declaration
- `simulate_deploy_account_transaction` - Simulate account deployment

**Environment Variables:**

- `STARKNET_RPC_URL`
- `STARKNET_ACCOUNT_ADDRESS`
- `STARKNET_PRIVATE_KEY`

**Example Requests:**

- "Simulate this transaction before executing"
- "Simulate deploying my contract"

### Contract (`contract`)

**Description:** Starknet contract declaration and deployment operations

**Tools:**

- `declare_contract` - Declare a smart contract
- `deploy_contract` - Deploy a declared contract
- `get_constructor_params` - Get required constructor parameters

**Environment Variables:**

- `STARKNET_RPC_URL`
- `STARKNET_ACCOUNT_ADDRESS`
- `STARKNET_PRIVATE_KEY`

**Example Requests:**

- "Declare my smart contract"
- "Deploy the contract at class hash 0x123..."
- "What constructor params does this contract need?"

---

## Development Tools

Tools for Cairo development, compilation, and AI-powered coding assistance.

### Scarb (`scarb`)

**Description:** Scarb Cairo compilation and program execution operations

**Tools:**

- `install_scarb` - Install Scarb toolchain
- `init_project` - Initialize a new Cairo project
- `build_project` - Build/compile a Cairo project
- `execute_program` - Execute a Cairo program
- `prove_program` - Generate proof for a Cairo program
- `verify_program` - Verify a Cairo program proof

**Environment Variables:** None required

**Example Requests:**

- "Initialize a new Cairo project"
- "Build my Cairo project"
- "Execute my Cairo program"

### Cairo Coder (`cairo-coder`)

**Description:** AI-powered Cairo code assistance and Starknet general knowledge via Cairo Coder API

**Tools:**

- `assist_with_cairo` - Get AI assistance for Cairo code development
- `starknet_general_knowledge` - Ask questions about Starknet ecosystem

**Environment Variables:**

- `CAIRO_CODER_API_KEY`

**Example Requests:**

- "How do I implement an ERC20 token in Cairo?"
- "Help me debug this Cairo contract"
- "What are the latest updates in Starknet?"

### Ask Starknet Help (`ask-starknet-help`)

**Description:** Help and documentation for Ask Starknet: usage guide, architecture explanation, capabilities listing, project ideas, and troubleshooting

**Tools:**

- `ask_starknet_help` - Get comprehensive help guide
- `ask_starknet_explain_architecture` - Understand Ask Starknet architecture
- `ask_starknet_list_capabilities` - List all available capabilities
- `ask_starknet_suggest_projects` - Get project ideas

**Environment Variables:** None required

**Example Requests:**

- "Help me get started with Ask Starknet"
- "Explain the Ask Starknet architecture"
- "What can Ask Starknet do?"
- "Suggest a DeFi project I can build"

---

## Special Applications

Unique applications and experimental features.

### Artpeace (`artpeace`)

**Description:** Collaborative pixel art creation on a shared canvas

**Tools:**

- `place_pixel` - Place a pixel on the collaborative canvas

**Environment Variables:**

- `STARKNET_RPC_URL`
- `STARKNET_ACCOUNT_ADDRESS`
- `STARKNET_PRIVATE_KEY`
- `PATH_UPLOAD_DIR`
- `SECRET_PHRASE`

**Example Requests:**

- "Place a red pixel at coordinates (100, 200)"
- "Draw on the Artpeace canvas"

---

## Summary Statistics

| Domain     | MCPs   | Tools (approx.) |
| ---------- | ------ | --------------- |
| Wallets    | 4      | 8               |
| DeFi       | 8      | 80+             |
| Blockchain | 5      | 40+             |
| Dev Tools  | 3      | 12+             |
| Special    | 1      | 1               |
| **Total**  | **21** | **140+**        |

## Getting More Information

For detailed information about a specific capability:

- Ask "How do I use [MCP name]?"
- Check environment variable requirements
- See example requests for each tool
- Visit the documentation at [docs.kasar.io](https://docs.kasar.io)
