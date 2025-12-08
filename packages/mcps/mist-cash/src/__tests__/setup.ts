import { Account, RpcProvider } from 'starknet';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface TestContext {
  onchainWrite: {
    account: Account;
    provider: RpcProvider;
  };
  onchainRead: {
    provider: RpcProvider;
  };
  testAccount: Account;
  testTokenAddress: string;
  testAmount: string;
  testRecipientAddress: string;
}

export function setupTestContext(): TestContext | null {
  const privateKey = process.env.STARKNET_PRIVATE_KEY;
  const accountAddress = process.env.STARKNET_ACCOUNT_ADDRESS;
  const rpcUrl = process.env.STARKNET_RPC_URL;
  const testTokenAddress =
    process.env.TEST_TOKEN_ADDRESS ||
    '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';
  const testAmount = process.env.TEST_AMOUNT || '0.0001'; // Default: 0.0001 tokens (in standard units)
  const testRecipientAddress = process.env.TEST_RECIPIENT_ADDRESS;
  if (!privateKey || !accountAddress || !rpcUrl || !testRecipientAddress) {
    console.warn(
      'Skipping integration tests: STARKNET_PRIVATE_KEY and STARKNET_ACCOUNT_ADDRESS and STARKNET_RPC_URL and TEST_RECIPIENT_ADDRESS must be set'
    );
    return null;
  }

  // Initialize provider
  const provider = new RpcProvider({ nodeUrl: rpcUrl });

  // Initialize account
  const testAccount = new Account({
    provider: provider,
    address: accountAddress,
    signer: privateKey,
  });

  return {
    onchainWrite: {
      account: testAccount,
      provider,
    },
    onchainRead: {
      provider,
    },
    testAccount,
    testTokenAddress,
    testAmount,
    testRecipientAddress,
  };
}

export function skipIfNoCredentials(): boolean {
  if (
    !process.env.STARKNET_PRIVATE_KEY ||
    !process.env.STARKNET_ACCOUNT_ADDRESS
  ) {
    console.log(
      '⚠️  Skipping test - STARKNET_PRIVATE_KEY and STARKNET_ACCOUNT_ADDRESS not set'
    );
    return true;
  }
  return false;
}
