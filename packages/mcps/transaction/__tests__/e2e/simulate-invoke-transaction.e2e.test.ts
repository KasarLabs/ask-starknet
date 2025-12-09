import { describe, it, expect } from '@jest/globals';
import { getOnchainWrite, getDataAsRecord } from '@kasarlabs/ask-starknet-core';
import { simulateInvokeTransaction } from '../../src/tools/simulateTransaction.js';
import { SimulateInvokeTransactionParams } from '../../src/lib/types/simulateTransactionTypes.js';

describe('Transaction MCP - Simulate Invoke Transaction E2E Tests', () => {
  const ETH_TOKEN_ADDRESS =
    '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';

  describe('simulateInvokeTransaction', () => {
    it('should successfully simulate a simple invoke transaction (ERC20 balance check)', async () => {
      const onchainWrite = getOnchainWrite();
      const accountAddress = process.env.STARKNET_ACCOUNT_ADDRESS;

      if (!accountAddress) {
        throw new Error(
          'STARKNET_ACCOUNT_ADDRESS must be set in environment variables'
        );
      }

      const params: SimulateInvokeTransactionParams = {
        accountAddress,
        payloads: [
          {
            contractAddress: ETH_TOKEN_ADDRESS,
            entrypoint: 'balance_of',
            calldata: [accountAddress],
          },
        ],
      };

      const result = await simulateInvokeTransaction(onchainWrite, params);

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.transaction_output).toBeDefined();
        expect(Array.isArray(data.transaction_output)).toBe(true);

        const txOutput = data.transaction_output as Array<any>;
        expect(txOutput.length).toBeGreaterThan(0);

        const firstTx = txOutput[0];
        expect(firstTx.transaction_number).toBe(1);
        expect(firstTx.fee_estimation).toBeDefined();
        expect(firstTx.fee_estimation.details).toBeDefined();
        expect(firstTx.fee_estimation.details.overall_fee).toBeDefined();
        expect(firstTx.resource_bounds).toBeDefined();
        expect(firstTx.resource_bounds.l1_gas).toBeDefined();
        expect(firstTx.resource_bounds.l2_gas).toBeDefined();
      }
    });

    it('should successfully simulate multiple invoke transactions', async () => {
      const onchainWrite = getOnchainWrite();
      const accountAddress = process.env.STARKNET_ACCOUNT_ADDRESS;

      if (!accountAddress) {
        throw new Error(
          'STARKNET_ACCOUNT_ADDRESS must be set in environment variables'
        );
      }

      const params: SimulateInvokeTransactionParams = {
        accountAddress,
        payloads: [
          {
            contractAddress: ETH_TOKEN_ADDRESS,
            entrypoint: 'balance_of',
            calldata: [accountAddress],
          },
          {
            contractAddress: ETH_TOKEN_ADDRESS,
            entrypoint: 'decimals',
            calldata: [],
          },
        ],
      };

      const result = await simulateInvokeTransaction(onchainWrite, params);

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.transaction_output).toBeDefined();
        expect(Array.isArray(data.transaction_output)).toBe(true);

        const txOutput = data.transaction_output as Array<any>;
        expect(txOutput.length).toBeGreaterThan(0);

        txOutput.forEach((tx, index) => {
          expect(tx.transaction_number).toBe(index + 1);
          expect(tx.fee_estimation).toBeDefined();
          expect(tx.resource_bounds).toBeDefined();
        });
      }
    });

    it('should handle simulation of transfer transaction', async () => {
      const onchainWrite = getOnchainWrite();
      const accountAddress = process.env.STARKNET_ACCOUNT_ADDRESS;
      const recipientAddress = process.env.TEST_SPENDER_ADDRESS;

      if (!accountAddress || !recipientAddress) {
        throw new Error(
          'STARKNET_ACCOUNT_ADDRESS and TEST_SPENDER_ADDRESS must be set in environment variables'
        );
      }

      const params: SimulateInvokeTransactionParams = {
        accountAddress,
        payloads: [
          {
            contractAddress: ETH_TOKEN_ADDRESS,
            entrypoint: 'transfer',
            calldata: [recipientAddress, '1', '0'],
          },
        ],
      };

      const result = await simulateInvokeTransaction(onchainWrite, params);

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.transaction_output).toBeDefined();
        expect(Array.isArray(data.transaction_output)).toBe(true);

        const txOutput = data.transaction_output as Array<any>;
        expect(txOutput.length).toBeGreaterThan(0);

        const firstTx = txOutput[0];
        expect(firstTx.transaction_number).toBe(1);
        expect(firstTx.fee_estimation).toBeDefined();
        expect(firstTx.fee_estimation.details.overall_fee).toBeDefined();

        const overallFee = firstTx.fee_estimation.details.overall_fee;
        expect(typeof overallFee).toBe('string');
        expect(BigInt(overallFee)).toBeGreaterThan(0n);
      }
    });
  });
});
