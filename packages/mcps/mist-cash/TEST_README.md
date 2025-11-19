# Mist Cash MCP Integration Tests

This directory contains end-to-end integration tests for the Mist Cash MCP functions.

## Overview

The tests are organized into separate files for each major function:

- **[deposit.test.ts](src/__tests__/tools/deposit.test.ts)** - Tests for depositing tokens into Mist Cash chambers
- **[withdraw.test.ts](src/__tests__/tools/withdraw.test.ts)** - Tests for withdrawing tokens from chambers
- **[getChamberInfo.test.ts](src/__tests__/tools/getChamberInfo.test.ts)** - Tests for retrieving chamber information

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Then edit `.env` with your test configuration:

```env
STARKNET_PRIVATE_KEY=your_private_key_here
STARKNET_ACCOUNT_ADDRESS=your_account_address_here
STARKNET_RPC_URL=https://starknet-sepolia.public.blastapi.io/rpc/v0_7
TEST_TOKEN_ADDRESS=0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7
```

**Important Notes:**

- Use a **Sepolia testnet** account for testing
- Make sure your account has sufficient testnet ETH for gas fees
- Make sure your account has the test token balance for deposits
- Never commit your `.env` file with real credentials

### 3. Prepare Test Data for Withdrawal Tests

Withdrawal tests require a valid claiming key from a previous deposit. To set this up:

1. First, run the deposit tests to create a test deposit:

   ```bash
   pnpm test deposit.test.ts
   ```

2. Copy the `claimingKey` and `amount` from the deposit test output

3. Add them to your `.env` file:

   ```env
   TEST_CLAIMING_KEY=0xYOUR_CLAIMING_KEY_HERE
   TEST_AMOUNT=1000000000000000
   ```

4. Now you can run the withdrawal and chamber info tests

## Running Tests

### Run All Tests

```bash
pnpm test
```

### Run Specific Test Suite

```bash
pnpm test deposit.test.ts
pnpm test withdraw.test.ts
pnpm test getChamberInfo.test.ts
```

### Run Tests in Watch Mode

```bash
pnpm test:watch
```

### Run Tests with Coverage

```bash
pnpm test:coverage
```

## Test Structure

### Shared Setup ([setup.ts](src/__tests__/setup.ts))

The `setup.ts` file provides shared utilities:

- `setupTestContext()` - Initializes providers and accounts
- `skipIfNoCredentials()` - Helper to skip tests when credentials are missing
- `TestContext` - Type definition for test context

### Deposit Tests

Tests cover:

- ✅ Successful deposits with auto-generated claiming keys
- ✅ Deposits with custom claiming keys
- ✅ Claiming key normalization for keys that are too long
- ✅ Token decimals fetching
- ✅ Different token amounts
- ❌ Error handling for invalid inputs

### Withdraw Tests

Tests cover:

- ✅ Successful withdrawals from chambers
- ✅ Merkle proof calculation
- ✅ Token decimals and formatted amounts
- ❌ Rejection of transactions not in merkle tree
- ❌ Rejection of invalid recipient addresses
- ❌ Rejection of already withdrawn transactions

### Chamber Info Tests

Tests cover:

- ✅ Retrieving chamber info for valid deposits
- ✅ Fetching token details (name, symbol, decimals)
- ✅ Checking if transaction exists in merkle tree
- ✅ Amount formatting based on token decimals
- ✅ Claiming key normalization
- ✅ Recipient address validation
- ❌ Handling non-existent chambers

## Test Timeouts

All tests have a 120-second (2 minute) timeout to account for:

- Network latency
- Transaction confirmation times
- Blockchain operations

## Troubleshooting

### Tests Are Skipped

If you see: `⚠️ Skipping test - STARKNET_PRIVATE_KEY and STARKNET_ACCOUNT_ADDRESS not set`

Make sure:

1. Your `.env` file exists in the package root
2. It contains valid `STARKNET_PRIVATE_KEY` and `STARKNET_ACCOUNT_ADDRESS`
3. The environment variables are properly loaded

### Insufficient Balance Errors

If tests fail with insufficient balance:

1. Get testnet ETH from a Sepolia faucet
2. Ensure your account has the test token balance

### RPC Connection Errors

If you see RPC connection errors:

1. Check your `STARKNET_RPC_URL` is correct
2. Try using a different RPC endpoint
3. Check your network connection

### Withdrawal Tests Failing

If withdrawal tests fail:

1. Make sure you've run deposit tests first
2. Verify `TEST_CLAIMING_KEY` and `TEST_AMOUNT` are set in `.env`
3. Ensure the deposit transaction hasn't been withdrawn already

## CI/CD Integration

These tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run Integration Tests
  env:
    STARKNET_PRIVATE_KEY: ${{ secrets.STARKNET_PRIVATE_KEY }}
    STARKNET_ACCOUNT_ADDRESS: ${{ secrets.STARKNET_ACCOUNT_ADDRESS }}
    STARKNET_RPC_URL: ${{ secrets.STARKNET_RPC_URL }}
  run: pnpm test
```

**Note:** Store sensitive credentials as secrets in your CI/CD platform.

## Contributing

When adding new tests:

1. Follow the existing test structure
2. Use the shared `setup.ts` utilities
3. Add appropriate test timeouts for blockchain operations
4. Include both success and error scenarios
5. Log meaningful output for debugging

## Resources

- [Mist Cash SDK Documentation](https://github.com/keep-starknet-strange/mist-cash)
- [Starknet Documentation](https://docs.starknet.io)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
