# DeFi Project Ideas

Build powerful DeFi applications using Ask Starknet's comprehensive suite of protocols and tools.

## Token Portfolio Tracker

**Description:** Real-time portfolio tracking application that monitors ERC20 token balances across multiple wallets and displays total value

**Required MCPs:**
- `erc20` - Token balance queries
- `starknet-rpc` - Blockchain data access

**Key Features:**
- Track multiple wallet addresses simultaneously
- Display token balances and current prices
- Calculate and display total portfolio value
- Historical balance tracking with charts
- Price alerts and notifications
- Export portfolio data

**Example Use Cases:**
- Monitor multiple wallets from a single dashboard
- Track portfolio performance over time
- Get notified when token prices change significantly
- Generate portfolio reports for tax purposes

**Technical Highlights:**
- Use `erc20_get_balance` to fetch balances for multiple tokens
- Use `get_block_number` to timestamp balance snapshots
- Implement caching to reduce RPC calls
- Store historical data for trend analysis

---

## Multi-DEX Swap Aggregator

**Description:** DEX aggregator that finds the best swap routes across multiple decentralized exchanges (AVNU, Ekubo, Fibrous)

**Required MCPs:**
- `avnu` - AVNU DEX integration
- `ekubo` - Ekubo AMM operations
- `fibrous` - Fibrous swap routing
- `erc20` - Token approvals and transfers

**Key Features:**
- Compare swap rates across multiple DEXes in real-time
- Execute swaps on the DEX with the best rate
- Display liquidity pools and fee structures
- Slippage protection and price impact warnings
- Transaction history with gas costs
- Routing visualization

**Example Use Cases:**
- Find the best price for any token swap
- Save money on trades by using optimal routes
- Compare liquidity across different protocols
- Batch multiple swaps for gas efficiency

**Technical Highlights:**
- Parallel route queries to AVNU, Ekubo, and Fibrous
- Use `avnu_get_route`, `ekubo.get_token_price`, `fibrous_get_route`
- Implement price impact calculations
- Consider gas costs in route optimization
- Handle approvals automatically before swaps

---

## Automated Yield Optimizer

**Description:** Smart yield farming bot that automatically moves funds between Vesu, Opus, and Endurfi to maximize returns

**Required MCPs:**
- `vesu` - Lending and yield farming
- `opus` - CDP and borrowing operations
- `endurfi` - Liquid staking
- `erc20` - Token management

**Key Features:**
- Monitor APY across multiple protocols automatically
- Automatic fund rebalancing based on yield opportunities
- Compound earnings automatically for maximum returns
- Risk assessment and management dashboard
- Yield performance analytics and reporting
- Configurable risk tolerance settings

**Example Use Cases:**
- Automatically move funds to highest-yielding protocols
- Compound staking rewards automatically
- Diversify yield sources to reduce risk
- Track total yield earned across protocols

**Technical Highlights:**
- Poll APY data from each protocol regularly
- Use `vesu_deposit_earn`, `opus.borrow_trove`, `endurfi.stake`
- Implement rebalancing logic with thresholds
- Calculate gas costs vs. yield improvement
- Use `preview_stake` and similar preview functions
- Manage approvals for multiple protocols

---

## Liquidation Monitor & Bot

**Description:** Monitor lending positions across protocols and execute liquidations or protect your own positions

**Required MCPs:**
- `opus` - Trove health monitoring
- `vesu` - Position tracking
- `extended` - Perpetuals position monitoring
- `erc20` - Token operations

**Key Features:**
- Real-time health factor monitoring across protocols
- Liquidation opportunity alerts with profit estimates
- Automatic position protection (add collateral when needed)
- Liquidation execution bot for profit
- Risk analytics dashboard
- Multi-protocol support

**Example Use Cases:**
- Monitor your Opus Troves to avoid liquidation
- Find and execute profitable liquidations
- Get alerted when positions become risky
- Automate collateral management

**Technical Highlights:**
- Use `get_trove_health` to monitor Opus positions
- Poll health factors at regular intervals
- Implement liquidation profitability calculations
- Use `deposit_trove` for automatic protection
- Track gas costs vs. liquidation profits
- Support multiple assets and protocols

---

## Cross-Protocol Position Manager

**Description:** Unified dashboard to manage DeFi positions across multiple protocols from a single interface

**Required MCPs:**
- `avnu` - DEX operations
- `ekubo` - Liquidity management
- `opus` - CDP management
- `vesu` - Lending positions
- `endurfi` - Staking positions
- `extended` - Perpetuals trading
- `erc20` - Token operations

**Key Features:**
- Unified position overview across all protocols
- One-click position management (deposit, withdraw, rebalance)
- Cross-protocol analytics and insights
- Rebalancing recommendations based on market conditions
- Gas optimization for batch operations
- Portfolio risk metrics

**Example Use Cases:**
- See all your DeFi positions in one place
- Manage positions across 5+ protocols from single UI
- Get recommendations for portfolio optimization
- Execute complex multi-protocol strategies

**Technical Highlights:**
- Aggregate data from multiple MCPs
- Use batch operations where possible
- Implement smart routing for best prices
- Calculate cross-protocol APY comparisons
- Handle approvals efficiently
- Build transaction batching for gas savings

---

## Memecoin Launcher Platform

**Description:** No-code platform for launching memecoins with automatic liquidity locking and Ekubo integration

**Required MCPs:**
- `unruggable` - Memecoin creation
- `ekubo` - Liquidity provision
- `erc20` - Token deployment

**Key Features:**
- One-click memecoin creation with customizable parameters
- Automatic liquidity provision on Ekubo
- Liquidity locking mechanism for safety
- Fair launch options (no presale)
- Token analytics dashboard
- Community governance tools

**Example Use Cases:**
- Launch a memecoin in minutes
- Create fair-launch tokens with locked liquidity
- Provide initial liquidity automatically
- Build trust with provable liquidity locks

**Technical Highlights:**
- Use `create_memecoin` with custom parameters
- Use `launch_on_ekubo` for automatic liquidity
- Implement `get_locked_liquidity` checks
- Verify liquidity lock with `is_memecoin`
- Create clean UI for token parameters
- Add social features (token chat, announcements)

---

## Trading Bot with Alerts

**Description:** Automated perpetuals trading bot with custom strategies and risk management on Extended

**Required MCPs:**
- `extended` - Perpetuals trading
- `erc20` - Token management
- `starknet-rpc` - Blockchain monitoring

**Key Features:**
- Multiple trading strategies (DCA, grid, momentum)
- Position management with TP/SL
- Real-time price alerts and notifications
- Leverage management and auto-deleveraging
- PnL tracking and reporting
- Backtesting capabilities with historical data

**Example Use Cases:**
- Automate DCA (Dollar Cost Averaging) strategies
- Run grid trading bots on volatile pairs
- Implement momentum trading with indicators
- Manage multiple positions with automated TP/SL

**Technical Highlights:**
- Use `extended_get_candles_history` for price data
- Implement strategy logic with indicators
- Use `extended_create_limit_order_with_tpsl` for orders
- Monitor with `extended_get_positions`
- Calculate funding rates with `extended_get_funding_rates_history`
- Track PnL with `extended_get_trades_history`

---

## DeFi Protocol Monitor

**Description:** Real-time monitoring dashboard for DeFi protocol metrics, TVL, volumes, and user activity

**Required MCPs:**
- `avnu` - DEX volume tracking
- `ekubo` - Pool analytics
- `opus` - Lending metrics
- `vesu` - Protocol stats
- `endurfi` - Staking data
- `starknet-rpc` - Blockchain data

**Key Features:**
- Protocol TVL (Total Value Locked) tracking
- Volume and fee analytics across DEXes
- User activity metrics and growth trends
- Historical data visualization
- Custom alerts and notifications
- Comparison tools across protocols

**Example Use Cases:**
- Monitor TVL growth across Starknet DeFi
- Track volume trends on DEXes
- Analyze user adoption metrics
- Get alerted when metrics change significantly

**Technical Highlights:**
- Use `get_pool_liquidity` for TVL data
- Aggregate swap data from multiple DEXes
- Use `get_total_staked` from Endurfi
- Store time-series data for trends
- Implement real-time websocket connections
- Create interactive charts and dashboards

---

## Arbitrage Bot

**Description:** Detect and execute arbitrage opportunities across DEXes and perpetual exchanges

**Required MCPs:**
- `avnu` - DEX trading
- `ekubo` - AMM operations
- `fibrous` - Swap routing
- `extended` - Perpetuals trading
- `erc20` - Token operations

**Key Features:**
- Real-time arbitrage detection across multiple DEXes
- Multi-DEX route optimization for best profits
- Spot vs perpetual arbitrage (funding rate arb)
- Automatic execution with gas cost consideration
- Profitability tracking and analytics
- Risk management (slippage, MEV protection)

**Example Use Cases:**
- Find price discrepancies between DEXes
- Execute triangular arbitrage on AMMs
- Arbitrage funding rates on perpetuals
- Flash arbitrage on volatile markets

**Technical Highlights:**
- Poll prices from multiple sources simultaneously
- Calculate arbitrage profit after gas costs
- Use `fibrous_batch_swap` for multi-hop arbs
- Implement MEV protection strategies
- Monitor execution speed (latency optimization)
- Use `extended_get_market_orderbook` for perp prices

---

## Additional Ideas

### Yield Aggregator Dashboard
Track yield opportunities across all Starknet protocols in real-time

### Auto-Compounder Service
Automatically compound rewards from staking and farming positions

### Lending Risk Calculator
Calculate and visualize risk metrics for lending positions

### DEX Liquidity Tracker
Monitor and analyze liquidity depth across all DEXes

### Token Launch Tracker
Track new token launches and liquidity additions

---

## Getting Started

To build any of these projects:

1. **Set up environment variables** for the required MCPs
2. **Test individual MCP calls** to understand the data
3. **Build the core logic** using Ask Starknet tools
4. **Add error handling** and edge case management
5. **Create a user interface** (web, CLI, or bot)
6. **Deploy and monitor** your application

For help getting started, ask:
- "How do I use [MCP name]?"
- "Show me examples for [specific tool]"
- "What environment variables do I need?"
