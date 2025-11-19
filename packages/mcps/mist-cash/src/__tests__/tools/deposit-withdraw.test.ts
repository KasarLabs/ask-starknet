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
    const depositParsed = JSON.parse(depositResult);

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
    const withdrawParsed = JSON.parse(withdrawResult);

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
  }, 240000); // 4 minute timeout for both operations

  // it('should fail when trying to withdraw the same transaction twice', async () => {
  //   if (skipIfNoCredentials() || !context) {
  //     console.log('⚠️  Skipping: No test credentials provided');
  //     return;
  //   }

  //   const amount = '1000000000000000'; // 0.001 STRK

  //   // Step 1: Deposit
  //   console.log('📥 Depositing tokens...');
  //   const depositParams: DepositToChamberParams = {
  //     tokenAddress: context.testTokenAddress,
  //     amount,
  //     recipientAddress: context.testAccount.address,
  //   };

  //   const depositResult = await depositToChamber(
  //     context.onchainWrite,
  //     depositParams
  //   );
  //   const depositParsed = JSON.parse(depositResult);

  //   expect(depositParsed.success).toBe(true);
  //   const claimingKey = depositParsed.data.claimingKey;

  //   console.log('✅ Deposit successful, claiming key:', claimingKey);

  //   // Step 2: Wait for transaction to be processed
  //   await new Promise((resolve) => setTimeout(resolve, 5000));

  //   // Step 3: First withdrawal (should succeed)
  //   console.log('📤 Attempting first withdrawal...');
  //   const withdrawParams: WithdrawFromChamberParams = {
  //     claimingKey,
  //     recipientAddress: context.testAccount.address,
  //     tokenAddress: context.testTokenAddress,
  //     amount,
  //   };

  //   const firstWithdrawResult = await withdrawFromChamber(
  //     context.onchainWrite,
  //     withdrawParams
  //   );
  //   const firstWithdrawParsed = JSON.parse(firstWithdrawResult);

  //   expect(firstWithdrawParsed.success).toBe(true);
  //   console.log('✅ First withdrawal successful');

  //   // Step 4: Wait for withdrawal to be processed
  //   await new Promise((resolve) => setTimeout(resolve, 5000));

  //   // Step 5: Second withdrawal (should fail)
  //   console.log('📤 Attempting second withdrawal (should fail)...');
  //   await expect(
  //     withdrawFromChamber(context.onchainWrite, withdrawParams)
  //   ).rejects.toThrow('Transaction not found in merkle tree');

  //   console.log('✅ Correctly rejected double withdrawal attempt');
  // }, 360000); // 6 minute timeout for complete flow
});
