import { describe, it, expect, beforeAll } from '@jest/globals';
import { depositToChamber } from '../../tools/deposit.js';
import type { DepositToChamberParams } from '../../schemas/index.js';
import {
  setupTestContext,
  skipIfNoCredentials,
  type TestContext,
} from '../setup.js';

describe('depositToChamber - Integration Tests', () => {
  let context: TestContext | null;

  beforeAll(() => {
    context = setupTestContext();
  });

  it('should deposit successfully with auto-generated claiming key', async () => {
    if (skipIfNoCredentials() || !context) {
      console.log('Skipping: No test credentials provided');
      return;
    }

    const params: DepositToChamberParams = {
      tokenAddress: context.testTokenAddress,
      amount: context.testAmount,
      recipientAddress: context.testRecipientAddress,
    };

    const result = await depositToChamber(context.onchainWrite, params);
    if (
      result.status !== 'success' ||
      !result.data ||
      result.data.length === 0
    ) {
      throw new Error(`Deposit failed: ${result.error}`);
    }
    const parsedResult = JSON.parse((result.data as string[])[0]);

    expect(parsedResult.success).toBe(true);
    expect(parsedResult.message).toBe('Successfully deposited into chamber');
    expect(parsedResult.data).toHaveProperty('claimingKey');
    expect(parsedResult.data).toHaveProperty('transactionHash');
    expect(parsedResult.data).toHaveProperty('secret');
    expect(parsedResult.data.recipientAddress).toBe(
      context.testRecipientAddress
    );
    expect(parsedResult.data.tokenAddress).toBe(context.testTokenAddress);
    expect(parsedResult.data.amount).toBe(context.testAmount);

    console.log('✅ Deposit successful:', {
      claimingKey: parsedResult.data.claimingKey,
      transactionHash: parsedResult.data.transactionHash,
      amount: parsedResult.data.amount,
    });
  }, 120000); // 2 minute timeout for blockchain operations

  // it('should deposit successfully with provided claiming key', async () => {
  //   if (skipIfNoCredentials() || !context) {
  //     console.log('Skipping: No test credentials provided');
  //     return;
  //   }

  //   const customClaimingKey = '0x' + '1'.repeat(64); // Valid 256-bit key

  //   const params: DepositToChamberParams = {
  //     tokenAddress: context.testTokenAddress,
  //     amount: context.testAmount,
  //     claimingKey: customClaimingKey,
  //     recipientAddress: context.testAccount.address,
  //   };

  //   const result = await depositToChamber(context.onchainWrite, params);
  //   const parsedResult = JSON.parse(result);

  //   expect(parsedResult.success).toBe(true);
  //   expect(parsedResult.data.claimingKey).toBe(customClaimingKey);

  //   console.log('✅ Deposit with custom claiming key successful:', {
  //     claimingKey: parsedResult.data.claimingKey,
  //     transactionHash: parsedResult.data.transactionHash,
  //   });
  // }, 120000);

  // it('should normalize long claiming keys', async () => {
  //   if (skipIfNoCredentials() || !context) {
  //     console.log('Skipping: No test credentials provided');
  //     return;
  //   }

  //   const longClaimingKey = '0x' + 'a'.repeat(70); // Too long

  //   const params: DepositToChamberParams = {
  //     tokenAddress: context.testTokenAddress,
  //     amount: '1000000000000000',
  //     claimingKey: longClaimingKey,
  //     recipientAddress: context.testAccount.address,
  //   };

  //   const result = await depositToChamber(context.onchainWrite, params);
  //   const parsedResult = JSON.parse(result);

  //   expect(parsedResult.success).toBe(true);
  //   expect(parsedResult.data.claimingKey.length).toBeLessThanOrEqual(66); // 0x + 64 chars

  //   console.log('✅ Long claiming key normalized:', {
  //     original: longClaimingKey.substring(0, 20) + '...',
  //     normalized: parsedResult.data.claimingKey,
  //   });
  // }, 120000);

  // it('should fetch and return token decimals', async () => {
  //   if (skipIfNoCredentials() || !context) {
  //     console.log('Skipping: No test credentials provided');
  //     return;
  //   }

  //   const params: DepositToChamberParams = {
  //     tokenAddress: context.testTokenAddress,
  //     amount: '1000000000000000',
  //     recipientAddress: context.testAccount.address,
  //   };

  //   const result = await depositToChamber(context.onchainWrite, params);
  //   const parsedResult = JSON.parse(result);

  //   expect(parsedResult.success).toBe(true);
  //   expect(parsedResult.data).toHaveProperty('decimals');
  //   expect(typeof parsedResult.data.decimals).toBe('number');
  //   expect(parsedResult.data.decimals).toBeGreaterThanOrEqual(0);

  //   console.log('✅ Token decimals fetched:', parsedResult.data.decimals);
  // }, 120000);

  // it('should handle different token amounts', async () => {
  //   if (skipIfNoCredentials() || !context) {
  //     console.log('Skipping: No test credentials provided');
  //     return;
  //   }

  //   const params: DepositToChamberParams = {
  //     tokenAddress: context.testTokenAddress,
  //     amount: '2000000000000000', // 0.002 ETH
  //     recipientAddress: context.testAccount.address,
  //   };

  //   const result = await depositToChamber(context.onchainWrite, params);
  //   const parsedResult = JSON.parse(result);

  //   expect(parsedResult.success).toBe(true);
  //   expect(parsedResult.data.amount).toBe('2000000000000000');

  //   console.log('✅ Different amount deposit successful:', parsedResult.data.amount);
  // }, 120000);
});
