# Starkgate MCP Server

MCP server for Starkgate bridge operations between Ethereum L1 and Starknet L2.

## Features

- **Deposit**: Transfer tokens from Ethereum L1 to Starknet L2
- **Withdraw**: Initiate withdrawal from Starknet L2 to Ethereum L1

## Supported Tokens

- **ETH**: Native Ethereum on both L1 and L2
- **USDC**: USDC token on both layers (Mainnet only)

## Supported Networks

- **MAINNET**: Ethereum Mainnet ↔ Starknet Mainnet
- **SEPOLIA**: Ethereum Sepolia ↔ Starknet Sepolia (ETH only)

## Environment Variables

### For Deposits (L1 → L2)
```bash
ETHEREUM_PRIVATE_KEY=0x...      # Your Ethereum wallet private key
ETHEREUM_RPC_URL=https://...    # Ethereum RPC endpoint
```

### For Withdrawals (L2 → L1)
```bash
STARKNET_RPC_URL=https://...           # Starknet RPC endpoint
STARKNET_ACCOUNT_ADDRESS=0x...         # Your Starknet account address
STARKNET_PRIVATE_KEY=0x...             # Your Starknet private key
```

## Tools

### `starkgate_deposit`

Deposit tokens from Ethereum L1 to Starknet L2.

**Parameters:**
- `token`: Token to deposit (`ETH` | `USDC`)
- `amount`: Amount to deposit (in token units, e.g., "1.5" for 1.5 ETH)
- `l2RecipientAddress`: Starknet L2 address to receive tokens
- `network`: Network to use (`MAINNET` | `SEPOLIA`, default: `MAINNET`)

**Example:**
```json
{
  "token": "ETH",
  "amount": "0.1",
  "l2RecipientAddress": "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
  "network": "MAINNET"
}
```

**Response:**
```json
{
  "status": "success",
  "token": "ETH",
  "amount": "0.1",
  "l1_tx_hash": "0x...",
  "l2_recipient": "0x...",
  "estimated_l2_arrival": "10-15 minutes"
}
```

### `starkgate_withdraw`

Initiate withdrawal of tokens from Starknet L2 to Ethereum L1.

**Parameters:**
- `token`: Token to withdraw (`ETH` | `USDC`)
- `amount`: Amount to withdraw (in token units)
- `l1RecipientAddress`: Ethereum L1 address to receive tokens
- `network`: Network to use (`MAINNET` | `SEPOLIA`, default: `MAINNET`)

**Example:**
```json
{
  "token": "USDC",
  "amount": "100",
  "l1RecipientAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
  "network": "MAINNET"
}
```

**Response:**
```json
{
  "status": "success",
  "token": "USDC",
  "amount": "100",
  "l2_tx_hash": "0x...",
  "l1_recipient": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
  "message": "Withdrawal initiated on L2. Wait for the block to be proven on L1 (~few hours), then claim on L1 via Starkgate UI."
}
```

## Withdrawal Process

Withdrawals from L2 to L1 are a two-step process:

1. **Initiate on L2**: Use `starkgate_withdraw` to burn tokens on L2 and send a message to L1
2. **Wait for Proof**: Wait for the block containing your withdrawal to be proven on L1 (typically a few hours)
3. **Claim on L1**: Complete the withdrawal by claiming your tokens on L1 via [Starkgate UI](https://starkgate.starknet.io/)

## Important Notes

- **ETH Deposits**: For ETH, the amount is sent as transaction value
- **ERC20 Deposits**: For USDC, the contract automatically handles approval if needed
- **Withdrawal Timing**: L2→L1 withdrawals require waiting for ZK proof generation (~2-5 hours)
- **Gas Fees**: L1 operations require ETH for gas on Ethereum
- **L2 Fees**: L2 operations require STRK or ETH for gas on Starknet

## Contract Addresses

### Mainnet
- **ETH Bridge L1**: `0xae0Ee0A63A2cE6BaeEFFE56e7714FB4EFE48D419`
- **ETH Bridge L2**: `0x073314940630fd6dcda0d772d4c972c4e0a9946bef9dabf4ef84eda8ef542b82`
- **USDC Bridge L1**: `0xF6080D9fbEEbcd44D89aFfBFd42F098cbFf92816`
- **USDC Bridge L2**: `0x05cd48fccbfd8aa2773fe22c217e808319ffcc1c5a6a463f7d8fa2da48218196`

### Sepolia
- **ETH Bridge L1**: `0x8453FC6Cd1bCfE8D4dFC069C400B433054d47bDc`
- **ETH Bridge L2**: `0x04c5772d1914fe6ce891b64eb35bf3522aeae1315647314aac58b01137607f3f`

## References

- [Starkgate Official Docs](https://docs.starknet.io/starkgate/architecture/)
- [Starkgate UI](https://starkgate.starknet.io/)
- [Starknet Addresses Repository](https://github.com/starknet-io/starknet-addresses)
