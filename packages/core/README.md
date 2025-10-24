# @ask-starknet/core

Core utilities and shared functionality for the Ask Starknet MCP ecosystem.

## Features

- **Types**: Common TypeScript interfaces for MCP and Starknet environments
- **Utilities**: Logging, validation helpers, and common functions
- **Validation**: Zod schemas for environment variable validation

## Usage

```typescript
import { validateMCPEnvironment, logger, isValidAddress } from '@ask-starknet/core';

// Validate environment variables
const env = validateMCPEnvironment(process.env);

// Use logger
logger.info('Application started');

// Validate addresses
if (isValidAddress(address)) {
  // Process address
}
```

## Development

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Watch for changes
npm run dev

# Run tests
npm test
```
