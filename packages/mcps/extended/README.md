# Ask-Starknet - Extended MCP

The Extended MCP provides tools for interacting with Extended, a high-performance perpetual derivatives exchange built on Starknet. Extended combines off-chain order matching with on-chain settlement on Starknet L2.

## Tools

This MCP provides the following tools:

### Public Market Data

- **extended_get_markets**: Get list of available markets with configurations, trading statistics, and Layer 2 settings
- **extended_get_market_stats**: Get latest trading statistics for a market including volume, price changes, funding rate, and open interest
- **extended_get_market_orderbook**: Get current order book (bids and asks) for a specific market with configurable depth
- **extended_get_market_trades**: Get latest trades for a specific market showing price, quantity, side, and trade type
- **extended_get_candles_history**: Get historical OHLCV candles data for trades, mark prices, or index prices with customizable intervals
- **extended_get_funding_rates_history**: Get historical funding rates for a market (calculated every minute, applied hourly)

### Account Management (use API key)

- **extended_get_balance**: Get current account balance including collateral, equity, available for trade, unrealized PnL, and margin ratios
- **extended_get_user_account_info**: Get account details including status, account ID, L2 keys, vault information, and Starknet bridge address
- **extended_get_positions**: Get all currently open positions with size, PnL, liquidation price, leverage, and TP/SL settings
- **extended_get_open_orders**: Get all currently open orders including limit, market, conditional, and TP/SL orders
- **extended_get_order_by_id**: Get a specific order by its Extended-assigned order ID
- **extended_get_trades_history**: Get historical trades executed by the account with optional filters for market, type, and side
- **extended_get_orders_history**: Get historical orders (filled, canceled, or rejected) with optional filters
- **extended_get_positions_history**: Get historical closed positions with realized PnL
- **extended_get_funding_payments**: Get historical funding payments made or received for perpetual positions
- **extended_get_leverage**: Get current leverage settings for all markets
- **extended_get_fees**: Get the current fee schedule including maker, taker, and margin fees
- **extended_get_bridge_config**: Get supported EVM chains and bridge contract addresses for cross-chain deposits/withdrawals
- **extended_get_bridge_quote**: Get a quote for bridging funds between EVM chains and Starknet with estimated fees

### Trading (use API key and private key)

- **extended_create_limit_order**: Create a limit order with configurable price, quantity, time-in-force, post-only, and reduce-only options
- **extended_create_limit_order_with_tpsl**: Create a limit order with attached Take Profit and Stop Loss triggers based on the order
- **extended_create_market_order**: Create a market order that executes immediately at current market price with configurable slippage
- **extended_add_position_tpsl**: Add or update Take Profit and Stop Loss orders to an existing position for risk management
- **extended_cancel_order**: Cancel an existing open order by its Extended-assigned order ID
- **extended_update_leverage**: Update the leverage multiplier for a specific market (affects margin requirements)

## Configuration

This MCP requires the following environment variables:

```bash
EXTENDED_API_URL=https://api.starknet.extended.exchange
EXTENDED_API_KEY=your_api_key_here
EXTENDED_STARKKEY_PRIVATE=your_stark_private_key_here
```

#### Getting an API Key

1. Visit [Extended Exchange](https://starknet.extended.exchange/)
2. Create an account
3. Navigate to API settings in your account : **More > API > Account**
4. Generate a new API key
5. Add it to your `.env` file in the `EXTENDED_API_KEY` environment variable

#### Getting your Stark Private Key

1. The Stark key is derived from your EVM or starknet private key during account registration
2. You can export it from your Extended account dashboard in section **More > API > Account > Show API details**
3. Add it to your `.env` file in the `EXTENDED_STARKKEY_PRIVATE` environment variable

## Usage

The Extended MCP is used internally by the Ask-Starknet unified router or can be used directly by Claude Code and compatible MCP clients. When configured, it enables Extended trading functionality through natural language queries.

### Example Queries

```
"What's my current balance on Extended?"  // Uses extended_get_balance
"Show me my account details"  // Uses extended_get_user_account_info
"Show me my open positions"  // Uses extended_get_positions
"Get 1-hour candles for BTC-USD"  // Uses extended_get_candles_history
"Show funding rate history for ETH-USD"  // Uses extended_get_funding_rates_history
"Create a limit buy order for 0.1 BTC at 60000 USD"  // Uses extended_create_limit_order
"Place a market order to sell 0.5 ETH"  // Uses extended_create_market_order
"Create a limit order with take profit at 65000"  // Uses extended_create_limit_order_with_tpsl
"Add stop loss to my BTC position at 58000"  // Uses extended_add_position_tpsl
```

## Resources

- [Extended Exchange](https://starknet.extended.exchange/) - Main exchange platform
- [Extended API Documentation](https://api.docs.extended.exchange/) - Official API reference
- [Extended Documentation](https://docs.extended.exchange/) - User guides and concepts
