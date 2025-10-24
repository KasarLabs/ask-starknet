# Extended MCP Tests

E2E tests for the Extended MCP tools.

## Setup

1. **Build the MCP server**:

   ```bash
   cd packages/mcps/extended
   pnpm build
   ```

2. **Configure your API key**:

   ```bash
   cp .env.example .env
   # Edit .env and add your EXTENDED_API_KEY
   ```

3. **Get your Extended API key**:
   - Visit [Extended Exchange](https://starknet.extended.exchange/)
   - Navigate to API settings
   - Generate a new API key
   - Add it to your `.env` file

## Running Tests

### All READ Tools (Safe)

Tests all account management tools without modifying anything:

```bash
node __tests__/e2e/read.test.js
```

This will test:

- `extended_get_balance`
- `extended_get_positions`
- `extended_get_open_orders`
- `extended_get_trades_history`
- `extended_get_orders_history`
- `extended_get_positions_history`
- `extended_get_funding_payments`
- `extended_get_leverage`
- `extended_get_fees`

### Cancel Order (Modifies State)

⚠️ **WARNING**: This will cancel a real order!

```bash
# Cancel a specific order
ORDER_ID=12345 node __tests__/e2e/cancelOrder.test.js

# Or let it cancel the first open order it finds
node __tests__/e2e/cancelOrder.test.js
```

### Update Leverage (Modifies State)

⚠️ **WARNING**: This will modify your leverage settings!

```bash
# Update leverage for a specific market
MARKET_ID=BTC-USD LEVERAGE=10 node __tests__/e2e/updateLeverage.test.js

# Test multiple leverage values
TEST_ALL_VALUES=true MARKET_ID=BTC-USD node __tests__/e2e/updateLeverage.test.js
```

## Test Files

### `read.test.js`

- Tests all READ-only tools
- Safe to run anytime
- Validates API integration
- Tests error handling
- ~250 lines of comprehensive tests

### `cancelOrder.test.js`

- Tests `extended_cancel_order` tool
- ⚠️ Cancels actual orders
- Includes verification step
- Tests error handling for invalid order IDs
- ~180 lines

### `updateLeverage.test.js`

- Tests `extended_update_leverage` tool
- ⚠️ Modifies account settings
- Includes verification step
- Tests multiple leverage values
- Tests error handling for invalid parameters
- ~280 lines

## Test Structure

All tests follow the same pattern:

1. **Client Setup**: Creates MCP client connection
2. **Tool Execution**: Calls the tool with test parameters
3. **Response Validation**: Checks status and data structure
4. **Verification**: Confirms changes (for write operations)
5. **Error Handling**: Tests with invalid inputs
6. **Cleanup**: Closes client connection

## Expected Output

### Successful Test

```
🚀 Starting Extended Read Tools E2E Tests

✅ Client connected successfully

--- extended_get_balance ---
✅ extended_get_balance test passed
   Balance: 1000.00
   Equity: 1050.00
   ...

✅ All tests completed successfully!

👋 Client closed
```

### Failed Test

```
❌ Test failed: API request failed: 401 Unauthorized
💡 Tip: Make sure you have set EXTENDED_API_KEY in packages/mcps/extended/.env
```

## Common Issues

### Authentication Error

```
Error: EXTENDED_API_KEY environment variable is required
```

**Solution**: Add your API key to `.env`

### Connection Error

```
Error: connect ECONNREFUSED
```

**Solution**: Check your internet connection and Extended API status

### No Open Orders

```
⚠️ No open orders found to cancel
```

**Solution**: This is expected if you don't have open orders. Create one on Extended first.

### Invalid Market

```
Error: Market not found
```

**Solution**: Use a valid market ID like "BTC-USD", "ETH-USD", etc.

## Notes

- **READ tests** are safe and can be run anytime
- **WRITE tests** modify your account and should be run carefully
- All tests include a delay before executing destructive operations
- Tests validate responses match the expected format
- Error handling is tested with invalid inputs
- Tests output detailed logs for debugging

## Future Improvements

- [ ] Add tests for `extended_create_limit_order` (needs Stark signature)
- [ ] Add tests for `extended_create_market_order` (needs Stark signature)
- [ ] Add mock tests for offline testing
- [ ] Add performance benchmarks
- [ ] Add test coverage reporting
