import { describe, it, expect, beforeAll } from '@jest/globals';
import { getChamberInfo } from '../../tools/getChamberInfo.js';
import type { GetChamberInfoParams } from '../../schemas/index.js';
import {
  setupTestContext,
  skipIfNoCredentials,
  type TestContext,
} from '../setup.js';

describe('getChamberInfo - Integration Tests', () => {
  let context: TestContext | null;

  beforeAll(() => {
    context = setupTestContext();
  });

  it('should retrieve chamber info for valid claiming key and recipient', async () => {
    if (skipIfNoCredentials() || !context) {
      console.log('Skipping: No test credentials provided');
      return;
    }

    // Note: This test requires a valid claiming key from a previous deposit
    const claimingKey = process.env.TEST_CLAIMING_KEY;

    if (!claimingKey) {
      console.log(
        '⚠️  Skipping: TEST_CLAIMING_KEY must be set for chamber info tests'
      );
      return;
    }

    const params: GetChamberInfoParams = {
      claimingKey,
      recipientAddress: context.testAccount.address,
    };

    const result = await getChamberInfo(context.onchainRead, params);
    const parsedResult = JSON.parse(result);
    console.log('Chamber Info Result:', parsedResult);
    expect(parsedResult.success).toBe(true);
    expect(parsedResult.message).toBe('Chamber info retrieved successfully');
    expect(parsedResult.data.found).toBe(true);
    expect(parsedResult.data).toHaveProperty('tokenAddress');
    expect(parsedResult.data).toHaveProperty('tokenName');
    expect(parsedResult.data).toHaveProperty('tokenSymbol');
    expect(parsedResult.data).toHaveProperty('amount');
    expect(parsedResult.data).toHaveProperty('formattedAmount');
    expect(parsedResult.data).toHaveProperty('decimals');
    expect(parsedResult.data).toHaveProperty('exists');
    expect(parsedResult.data).toHaveProperty('warning');

    console.log('✅ Chamber info retrieved:', {
      tokenSymbol: parsedResult.data.tokenSymbol,
      amount: parsedResult.data.formattedAmount,
      exists: parsedResult.data.exists,
    });
  }, 120000);

  // it('should return not found for non-existent chamber', async () => {
  //   if (skipIfNoCredentials() || !context) {
  //     console.log('Skipping: No test credentials provided');
  //     return;
  //   }

  //   const invalidClaimingKey = '0x' + '9'.repeat(64);

  //   const params: GetChamberInfoParams = {
  //     claimingKey: invalidClaimingKey,
  //     recipientAddress: context.testAccount.address,
  //   };

  //   const result = await getChamberInfo(context.onchainRead, params);
  //   const parsedResult = JSON.parse(result);

  //   expect(parsedResult.success).toBe(false);
  //   expect(parsedResult.data.found).toBe(false);
  //   expect(parsedResult.message).toContain('No chamber found');

  //   console.log('✅ Correctly returned not found for non-existent chamber');
  // }, 120000);

  // it('should fetch token details including name, symbol, and decimals', async () => {
  //   if (skipIfNoCredentials() || !context) {
  //     console.log('Skipping: No test credentials provided');
  //     return;
  //   }

  //   const claimingKey = process.env.TEST_CLAIMING_KEY;

  //   if (!claimingKey) {
  //     console.log('⚠️  Skipping: TEST_CLAIMING_KEY must be set');
  //     return;
  //   }

  //   const params: GetChamberInfoParams = {
  //     claimingKey,
  //     recipientAddress: context.testAccount.address,
  //   };

  //   const result = await getChamberInfo(context.onchainRead, params);
  //   const parsedResult = JSON.parse(result);

  //   if (parsedResult.success && parsedResult.data.found) {
  //     expect(parsedResult.data.tokenName).toBeDefined();
  //     expect(parsedResult.data.tokenSymbol).toBeDefined();
  //     expect(parsedResult.data.decimals).toBeGreaterThanOrEqual(0);
  //     expect(typeof parsedResult.data.decimals).toBe('number');

  //     console.log('✅ Token details:', {
  //       name: parsedResult.data.tokenName,
  //       symbol: parsedResult.data.tokenSymbol,
  //       decimals: parsedResult.data.decimals,
  //     });
  //   }
  // }, 120000);

  // it('should check if transaction exists in merkle tree', async () => {
  //   if (skipIfNoCredentials() || !context) {
  //     console.log('Skipping: No test credentials provided');
  //     return;
  //   }

  //   const claimingKey = process.env.TEST_CLAIMING_KEY;

  //   if (!claimingKey) {
  //     console.log('⚠️  Skipping: TEST_CLAIMING_KEY must be set');
  //     return;
  //   }

  //   const params: GetChamberInfoParams = {
  //     claimingKey,
  //     recipientAddress: context.testAccount.address,
  //   };

  //   const result = await getChamberInfo(context.onchainRead, params);
  //   const parsedResult = JSON.parse(result);

  //   if (parsedResult.success && parsedResult.data.found) {
  //     expect(parsedResult.data).toHaveProperty('exists');
  //     expect(typeof parsedResult.data.exists).toBe('boolean');
  //     expect(parsedResult.data.warning).toBeDefined();

  //     if (parsedResult.data.exists) {
  //       expect(parsedResult.data.warning).toContain('can be withdrawn');
  //     } else {
  //       expect(parsedResult.data.warning).toContain('may have been withdrawn already');
  //     }

  //     console.log('✅ Merkle tree status:', {
  //       exists: parsedResult.data.exists,
  //       warning: parsedResult.data.warning,
  //     });
  //   }
  // }, 120000);

  // it('should normalize long claiming keys', async () => {
  //   if (skipIfNoCredentials() || !context) {
  //     console.log('Skipping: No test credentials provided');
  //     return;
  //   }

  //   const longClaimingKey = '0x' + 'a'.repeat(70); // Too long

  //   const params: GetChamberInfoParams = {
  //     claimingKey: longClaimingKey,
  //     recipientAddress: context.testAccount.address,
  //   };

  //   // Should not throw error, should normalize the key
  //   const result = await getChamberInfo(context.onchainRead, params);
  //   const parsedResult = JSON.parse(result);

  //   // The function should handle the normalization internally
  //   expect(parsedResult).toBeDefined();
  //   expect(parsedResult.data.claimingKey.length).toBeLessThanOrEqual(66);

  //   console.log('✅ Long claiming key handled correctly');
  // }, 120000);

  // it('should format amount correctly based on token decimals', async () => {
  //   if (skipIfNoCredentials() || !context) {
  //     console.log('Skipping: No test credentials provided');
  //     return;
  //   }

  //   const claimingKey = process.env.TEST_CLAIMING_KEY;

  //   if (!claimingKey) {
  //     console.log('⚠️  Skipping: TEST_CLAIMING_KEY must be set');
  //     return;
  //   }

  //   const params: GetChamberInfoParams = {
  //     claimingKey,
  //     recipientAddress: context.testAccount.address,
  //   };

  //   const result = await getChamberInfo(context.onchainRead, params);
  //   const parsedResult = JSON.parse(result);

  //   if (parsedResult.success && parsedResult.data.found) {
  //     expect(parsedResult.data.amount).toBeDefined();
  //     expect(parsedResult.data.formattedAmount).toBeDefined();
  //     expect(parsedResult.data.formattedAmount).not.toBe(parsedResult.data.amount);

  //     console.log('✅ Amount formatting:', {
  //       rawAmount: parsedResult.data.amount,
  //       formattedAmount: parsedResult.data.formattedAmount,
  //       decimals: parsedResult.data.decimals,
  //     });
  //   }
  // }, 120000);

  // it('should handle different recipient addresses correctly', async () => {
  //   if (skipIfNoCredentials() || !context) {
  //     console.log('Skipping: No test credentials provided');
  //     return;
  //   }

  //   const claimingKey = process.env.TEST_CLAIMING_KEY;

  //   if (!claimingKey) {
  //     console.log('⚠️  Skipping: TEST_CLAIMING_KEY must be set');
  //     return;
  //   }

  //   // Try with the correct recipient
  //   const params1: GetChamberInfoParams = {
  //     claimingKey,
  //     recipientAddress: context.testAccount.address,
  //   };

  //   const result1 = await getChamberInfo(context.onchainRead, params1);
  //   const parsedResult1 = JSON.parse(result1);

  //   // Try with a different recipient address
  //   const differentRecipient = '0x' + '1'.repeat(64);
  //   const params2: GetChamberInfoParams = {
  //     claimingKey,
  //     recipientAddress: differentRecipient,
  //   };

  //   const result2 = await getChamberInfo(context.onchainRead, params2);
  //   const parsedResult2 = JSON.parse(result2);

  //   // The results should be different
  //   if (parsedResult1.data.found) {
  //     expect(parsedResult2.data.found).toBe(false);
  //   }

  //   console.log('✅ Recipient address validation working correctly');
  // }, 120000);
});
