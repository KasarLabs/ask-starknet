import { describe, it, expect, beforeAll } from '@jest/globals';
import { withdrawFromChamber } from '../../tools/withdraw.js';
import type { WithdrawFromChamberParams } from '../../schemas/index.js';
import {
  setupTestContext,
  skipIfNoCredentials,
  type TestContext,
} from '../setup.js';

describe('withdrawFromChamber - Integration Tests', () => {
  let context: TestContext | null;

  beforeAll(() => {
    context = setupTestContext();
  });

  it('should withdraw successfully from chamber', async () => {
    if (skipIfNoCredentials() || !context) {
      console.log('Skipping: No test credentials provided');
      return;
    }

    // Note: This test requires a valid claiming key and transaction that exists in the merkle tree
    // You should replace these values with actual test data from a previous deposit
    const claimingKey = process.env.TEST_CLAIMING_KEY;
    // The original recipient should be the address used during deposit
    // By default, use TEST_ORIGINAL_RECIPIENT if provided, otherwise use STARKNET_ACCOUNT_ADDRESS
    if (!claimingKey) {
      console.log(
        '⚠️  Skipping: TEST_CLAIMING_KEY must be set for withdrawal tests'
      );
      return;
    }

    console.log(`Using claiming key: ${claimingKey}`);

    const params: WithdrawFromChamberParams = {
      claimingKey,
      recipientAddress: context.testRecipientAddress, // Must match the recipient from the original deposit!
      tokenAddress: context.testTokenAddress,
      amount: context.testAmount,
    };

    const result = await withdrawFromChamber(context.onchainWrite, params);
    const parsedResult = JSON.parse((result.data as any[])[0]);

    expect(parsedResult.success).toBe(true);
    expect(parsedResult.message).toBe('Successfully withdrawn from chamber');
    expect(parsedResult.data).toHaveProperty('transactionHash');
    expect(parsedResult.data).toHaveProperty('merkleProofLength');
    expect(parsedResult.data.recipientAddress).toBe(
      context.testAccount.address
    );
    expect(parsedResult.data.tokenAddress).toBe(context.testTokenAddress);
    expect(parsedResult.data.amount).toBe(context.testAmount);

    console.log('✅ Withdrawal successful:', {
      transactionHash: parsedResult.data.transactionHash,
      amount: parsedResult.data.formattedAmount,
      merkleProofLength: parsedResult.data.merkleProofLength,
    });
  }, 120000);
});
