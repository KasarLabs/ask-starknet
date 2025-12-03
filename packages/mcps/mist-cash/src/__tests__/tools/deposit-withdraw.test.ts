import { describe, it, expect, beforeAll } from '@jest/globals';
import { depositToChamber } from '../../tools/deposit.js';
import { withdrawFromChamber } from '../../tools/withdraw.js';
import type {
  DepositToChamberParams,
  WithdrawFromChamberParams,
} from '../../schemas/index.js';
import {
  setupTestContext,
  skipIfNoCredentials,
  type TestContext,
} from '../setup.js';

describe('Deposit and Withdraw - End-to-End Integration Tests', () => {
  let context: TestContext | null;

  beforeAll(() => {
    context = setupTestContext();
  });

  it('should deposit and then withdraw successfully', async () => {
    if (skipIfNoCredentials() || !context) {
      console.log('⚠️  Skipping: No test credentials provided');
      return;
    }

    // Step 1: Deposit
    console.log('Step 1: Depositing tokens into chamber...');
    const depositParams: DepositToChamberParams = {
      tokenAddress: context.testTokenAddress,
      amount: context.testAmount,
      recipientAddress: context.testAccount.address,
    };

    const depositResult = await depositToChamber(
      context.onchainWrite,
      depositParams
    );
    expect(depositResult.status).toBe('success');
    expect(depositResult.data).toBeDefined();
    expect(Array.isArray(depositResult.data)).toBe(true);
    const depositParsed = JSON.parse((depositResult.data as any[])[0]);

    expect(depositParsed.success).toBe(true);
    expect(depositParsed.data).toHaveProperty('claimingKey');
    expect(depositParsed.data).toHaveProperty('transactionHash');

    console.log('✅ Deposit successful:', {
      claimingKey: depositParsed.data.claimingKey,
      transactionHash: depositParsed.data.transactionHash,
      amount: depositParsed.data.amount,
    });

    // Step 2: Wait a bit for the transaction to be fully processed
    console.log('Waiting for deposit to be processed...');
    await new Promise((resolve) => setTimeout(resolve, 30000));

    // Step 3: Withdraw
    console.log('Step 2: Withdrawing tokens from chamber...');
    const withdrawParams: WithdrawFromChamberParams = {
      claimingKey: depositParsed.data.claimingKey,
      recipientAddress: context.testAccount.address,
      tokenAddress: context.testTokenAddress,
      amount: context.testAmount,
    };

    const withdrawResult = await withdrawFromChamber(
      context.onchainWrite,
      withdrawParams
    );
    expect(withdrawResult.status).toBe('success');
    expect(withdrawResult.data).toBeDefined();
    expect(Array.isArray(withdrawResult.data)).toBe(true);
    const withdrawParsed = JSON.parse((withdrawResult.data as any[])[0]);

    expect(withdrawParsed.success).toBe(true);
    expect(withdrawParsed.message).toBe('Successfully withdrawn from chamber');
    expect(withdrawParsed.data).toHaveProperty('transactionHash');
    expect(withdrawParsed.data).toHaveProperty('merkleProofLength');
    expect(withdrawParsed.data.recipientAddress).toBe(
      context.testAccount.address
    );
    expect(withdrawParsed.data.tokenAddress).toBe(context.testTokenAddress);
    expect(withdrawParsed.data.amount).toBe(context.testAmount);

    console.log('✅ Withdrawal successful:', {
      transactionHash: withdrawParsed.data.transactionHash,
      amount: withdrawParsed.data.formattedAmount,
      merkleProofLength: withdrawParsed.data.merkleProofLength,
    });

    console.log('\n🎉 End-to-end test completed successfully!');
  }, 240000);
});
