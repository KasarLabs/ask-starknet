# Extended TypeScript examples

Prerequisites:
- Node.js v22.18.0+

Create `.env.local` file from `.env.example` and fill in your data:
```properties
# Replace with `api.starknet.sepolia.extended.exchange` for TESTNET
API_HOST=api.starknet.extended.exchange
API_KEY=<YOUR_API_KEY>
STARK_PRIVATE_KEY=<YOUR_STARK_PRIVATE_KEY>
VAULT_ID=<YOUR_VAULT_ID>
```

You can get it from:
- [TESTNET API Management page](https://starknet.sepolia.extended.exchange/api-management)
- [MAINNET API Management page](https://app.extended.exchange/api-management)

Install project dependencies with `npm install`.

Run an example, e.g. `npm run example:01-create-limit-order`.

> [!WARNING]
> DON'T FORGET TO CANCEL YOUR POSITIONS/ORDERS IF YOU ARE USING MAINNET!

WASM module source code (Rust) can be found in the following repos:
- https://github.com/x10xchange/stark-crypto-wrapper-js
- https://github.com/x10xchange/rust-crypto-lib-base
