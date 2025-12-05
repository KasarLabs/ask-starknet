import { describe, it, expect } from '@jest/globals';
import { getOnchainWrite } from '@kasarlabs/ask-starknet-core';
import { simulateInvokeTransaction } from '../../src/tools/simulateTransaction.js';
import { SimulateInvokeTransactionParams } from '../../src/lib/types/simulateTransactionTypes.js';

function isRecord(
  data: Record<string, any> | Array<any>
): data is Record<string, any> {
  return !Array.isArray(data) && typeof data === 'object' && data !== null;
}

function getDataAsRecord(
  data: Record<string, any> | Array<any> | undefined
): Record<string, any> {
  if (!data || !isRecord(data)) {
    throw new Error('Expected data to be a Record object');
  }
  return data;
}

describe('Transaction MCP - Output Formatting E2E Tests', () => {
  const ETH_TOKEN_ADDRESS =
    '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';

  describe('Transaction output structure validation', () => {
    it('should return properly formatted transaction output with all required fields', async () => {
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
        const txOutput = data.transaction_output as Array<any>;

        expect(txOutput).toBeDefined();
        expect(Array.isArray(txOutput)).toBe(true);
        expect(txOutput.length).toBeGreaterThan(0);

        const tx = txOutput[0];

        expect(tx).toHaveProperty('transaction_number');
        expect(typeof tx.transaction_number).toBe('number');
        expect(tx.transaction_number).toBe(1);

        expect(tx).toHaveProperty('fee_estimation');
        expect(tx.fee_estimation).toHaveProperty('title');
        expect(tx.fee_estimation.title).toBe('Fee Estimation Breakdown');
        expect(tx.fee_estimation).toHaveProperty('details');
        expect(tx.fee_estimation.details).toHaveProperty('overall_fee');

        expect(tx).toHaveProperty('resource_bounds');
        expect(tx.resource_bounds).toHaveProperty('l1_gas');
        expect(tx.resource_bounds).toHaveProperty('l2_gas');

        expect(tx.resource_bounds.l1_gas).toHaveProperty('max_amount');
        expect(tx.resource_bounds.l1_gas).toHaveProperty('max_price_per_unit');
        expect(typeof tx.resource_bounds.l1_gas.max_amount).toBe('string');
        expect(typeof tx.resource_bounds.l1_gas.max_price_per_unit).toBe(
          'string'
        );

        expect(tx.resource_bounds.l2_gas).toHaveProperty('max_amount');
        expect(tx.resource_bounds.l2_gas).toHaveProperty('max_price_per_unit');
        expect(typeof tx.resource_bounds.l2_gas.max_amount).toBe('string');
        expect(typeof tx.resource_bounds.l2_gas.max_price_per_unit).toBe(
          'string'
        );
      }
    });

    it('should correctly number multiple transactions in output', async () => {
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
            entrypoint: 'name',
            calldata: [],
          },
          {
            contractAddress: ETH_TOKEN_ADDRESS,
            entrypoint: 'symbol',
            calldata: [],
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
        const txOutput = data.transaction_output as Array<any>;

        expect(Array.isArray(txOutput)).toBe(true);
        expect(txOutput.length).toBeGreaterThan(0);

        txOutput.forEach((tx, index) => {
          expect(tx.transaction_number).toBe(index + 1);
        });
      }
    });

    it('should format resource bounds as strings for large numbers', async () => {
      const onchainWrite = getOnchainWrite();
      const accountAddress = process.env.STARKNET_ACCOUNT_ADDRESS;
      const recipientAddress = process.env.TEST_SPENDER_ADDRESS;

      if (!accountAddress || !recipientAddress) {
        throw new Error(
          'STARKNET_ACCOUNT_ADDRESS and TEST_SPENDER_ADDRESS must be set'
        );
      }

      const params: SimulateInvokeTransactionParams = {
        accountAddress,
        payloads: [
          {
            contractAddress: ETH_TOKEN_ADDRESS,
            entrypoint: 'transfer',
            calldata: [recipientAddress, '1000000000000000', '0'],
          },
        ],
      };

      const result = await simulateInvokeTransaction(onchainWrite, params);

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        const txOutput = data.transaction_output as Array<any>;
        const tx = txOutput[0];

        expect(typeof tx.resource_bounds.l1_gas.max_amount).toBe('string');
        expect(typeof tx.resource_bounds.l1_gas.max_price_per_unit).toBe(
          'string'
        );
        expect(typeof tx.resource_bounds.l2_gas.max_amount).toBe('string');
        expect(typeof tx.resource_bounds.l2_gas.max_price_per_unit).toBe(
          'string'
        );

        expect(() =>
          BigInt(tx.resource_bounds.l1_gas.max_amount)
        ).not.toThrow();
        expect(() =>
          BigInt(tx.resource_bounds.l1_gas.max_price_per_unit)
        ).not.toThrow();
      }
    });

    it('should include fee estimation details for all transaction types', async () => {
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
        const txOutput = data.transaction_output as Array<any>;
        const tx = txOutput[0];

        expect(tx.fee_estimation).toBeDefined();
        expect(tx.fee_estimation.title).toBe('Fee Estimation Breakdown');
        expect(tx.fee_estimation.details).toBeDefined();
        expect(tx.fee_estimation.details.overall_fee).toBeDefined();

        const overallFee = tx.fee_estimation.details.overall_fee;
        expect(
          typeof overallFee === 'number' ||
            typeof overallFee === 'bigint' ||
            typeof overallFee === 'string'
        ).toBe(true);
      }
    });
  });
});
