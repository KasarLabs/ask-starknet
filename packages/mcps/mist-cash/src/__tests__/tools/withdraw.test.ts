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
    const parsedResult = JSON.parse(result);

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

  // it('should fail when transaction not found in merkle tree', async () => {
  //   if (skipIfNoCredentials() || !context) {
  //     console.log('Skipping: No test credentials provided');
  //     return;
  //   }

  //   const invalidClaimingKey = '0x' + '9'.repeat(64);

  //   const params: WithdrawFromChamberParams = {
  //     claimingKey: invalidClaimingKey,
  //     recipientAddress: context.testAccount.address,
  //     tokenAddress: context.testTokenAddress,
  //     amount: '1000000000000000',
  //   };

  //   await expect(withdrawFromChamber(context.onchainWrite, params)).rejects.toThrow(
  //     'Transaction not found in merkle tree'
  //   );

  //   console.log('✅ Correctly rejected invalid transaction');
  // }, 120000);

  // it('should fail with invalid recipient address', async () => {
  //   if (skipIfNoCredentials() || !context) {
  //     console.log('Skipping: No test credentials provided');
  //     return;
  //   }

  //   const claimingKey = process.env.TEST_CLAIMING_KEY;
  //   const amount = process.env.TEST_AMOUNT;

  //   if (!claimingKey || !amount) {
  //     console.log('⚠️  Skipping: TEST_CLAIMING_KEY and TEST_AMOUNT must be set');
  //     return;
  //   }

  //   const params: WithdrawFromChamberParams = {
  //     claimingKey,
  //     recipientAddress: '0xinvalid',
  //     tokenAddress: context.testTokenAddress,
  //     amount,
  //   };

  //   await expect(withdrawFromChamber(context.onchainWrite, params)).rejects.toThrow();

  //   console.log('✅ Correctly rejected invalid recipient address');
  // }, 120000);

  // it('should fetch token decimals during withdrawal', async () => {
  //   if (skipIfNoCredentials() || !context) {
  //     console.log('Skipping: No test credentials provided');
  //     return;
  //   }

  //   const claimingKey = process.env.TEST_CLAIMING_KEY;
  //   const amount = process.env.TEST_AMOUNT;

  //   if (!claimingKey || !amount) {
  //     console.log('⚠️  Skipping: TEST_CLAIMING_KEY and TEST_AMOUNT must be set');
  //     return;
  //   }

  //   const params: WithdrawFromChamberParams = {
  //     claimingKey,
  //     recipientAddress: context.testAccount.address,
  //     tokenAddress: context.testTokenAddress,
  //     amount,
  //   };

  //   const result = await withdrawFromChamber(context.onchainWrite, params);
  //   const parsedResult = JSON.parse(result);

  //   expect(parsedResult.success).toBe(true);
  //   expect(parsedResult.data).toHaveProperty('decimals');
  //   expect(parsedResult.data).toHaveProperty('formattedAmount');
  //   expect(typeof parsedResult.data.decimals).toBe('number');

  //   console.log('✅ Token decimals and formatted amount:', {
  //     decimals: parsedResult.data.decimals,
  //     formattedAmount: parsedResult.data.formattedAmount,
  //   });
  // }, 120000);

  // it('should calculate merkle proof for withdrawal', async () => {
  //   if (skipIfNoCredentials() || !context) {
  //     console.log('Skipping: No test credentials provided');
  //     return;
  //   }

  //   const claimingKey = process.env.TEST_CLAIMING_KEY;
  //   const amount = process.env.TEST_AMOUNT;

  //   if (!claimingKey || !amount) {
  //     console.log('⚠️  Skipping: TEST_CLAIMING_KEY and TEST_AMOUNT must be set');
  //     return;
  //   }

  //   const params: WithdrawFromChamberParams = {
  //     claimingKey,
  //     recipientAddress: context.testAccount.address,
  //     tokenAddress: context.testTokenAddress,
  //     amount,
  //   };

  //   const result = await withdrawFromChamber(context.onchainWrite, params);
  //   const parsedResult = JSON.parse(result);

  //   expect(parsedResult.success).toBe(true);
  //   expect(parsedResult.data.merkleProofLength).toBeGreaterThan(0);

  //   console.log('✅ Merkle proof calculated:', {
  //     proofLength: parsedResult.data.merkleProofLength,
  //   });
  // }, 120000);

  // it('should fail when withdrawing already withdrawn transaction', async () => {
  //   if (skipIfNoCredentials() || !context) {
  //     console.log('Skipping: No test credentials provided');
  //     return;
  //   }

  //   const withdrawnClaimingKey = process.env.TEST_WITHDRAWN_CLAIMING_KEY;
  //   const withdrawnAmount = process.env.TEST_WITHDRAWN_AMOUNT;

  //   if (!withdrawnClaimingKey || !withdrawnAmount) {
  //     console.log('⚠️  Skipping: TEST_WITHDRAWN_CLAIMING_KEY and TEST_WITHDRAWN_AMOUNT must be set');
  //     return;
  //   }

  //   const params: WithdrawFromChamberParams = {
  //     claimingKey: withdrawnClaimingKey,
  //     recipientAddress: context.testAccount.address,
  //     tokenAddress: context.testTokenAddress,
  //     amount: withdrawnAmount,
  //   };

  //   await expect(withdrawFromChamber(context.onchainWrite, params)).rejects.toThrow(
  //     'Transaction not found in merkle tree'
  //   );

  //   console.log('✅ Correctly rejected already withdrawn transaction');
  // }, 120000);
});
