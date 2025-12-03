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
    const parsedResult = JSON.parse((result.data as any[])[0]);
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
});
