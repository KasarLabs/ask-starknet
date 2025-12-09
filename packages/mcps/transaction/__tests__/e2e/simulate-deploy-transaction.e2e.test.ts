import { describe, it, expect } from '@jest/globals';
import { getOnchainWrite, getDataAsRecord } from '@kasarlabs/ask-starknet-core';
import { simulateDeployTransaction } from '../../src/tools/simulateTransaction.js';
import { SimulateDeployTransactionParams } from '../../src/lib/types/simulateTransactionTypes.js';
import { hash } from 'starknet';

describe('Transaction MCP - Simulate Deploy Transaction E2E Tests', () => {
  const ERC20_CLASS_HASH =
    '0x07c08cf5990a781c3fe4729e19f0e9e4e77e0579fa23a84b12b2ae3ae04b33bf';

  describe('simulateDeployTransaction', () => {
    it('should successfully simulate a deploy transaction with basic parameters', async () => {
      const onchainWrite = getOnchainWrite();
      const accountAddress = process.env.STARKNET_ACCOUNT_ADDRESS;

      if (!accountAddress) {
        throw new Error(
          'STARKNET_ACCOUNT_ADDRESS must be set in environment variables'
        );
      }

      const salt = hash.computePoseidonHashOnElements([123, 456]);

      const params: SimulateDeployTransactionParams = {
        accountAddress,
        payloads: [
          {
            classHash: ERC20_CLASS_HASH,
            salt: salt,
            unique: false,
            constructorCalldata: [],
          },
        ],
      };

      const result = await simulateDeployTransaction(onchainWrite, params);

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
        expect(firstTx.resource_bounds.l1_gas.max_amount).toBeDefined();
        expect(firstTx.resource_bounds.l2_gas).toBeDefined();
      }
    });

    it('should successfully simulate deploy with constructor calldata', async () => {
      const onchainWrite = getOnchainWrite();
      const accountAddress = process.env.STARKNET_ACCOUNT_ADDRESS;

      if (!accountAddress) {
        throw new Error(
          'STARKNET_ACCOUNT_ADDRESS must be set in environment variables'
        );
      }

      const salt = hash.computePoseidonHashOnElements([789, 101112]);

      const params: SimulateDeployTransactionParams = {
        accountAddress,
        payloads: [
          {
            classHash: ERC20_CLASS_HASH,
            salt: salt,
            unique: false,
            constructorCalldata: [accountAddress, '1000000', '0'],
          },
        ],
      };

      const result = await simulateDeployTransaction(onchainWrite, params);

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.transaction_output).toBeDefined();
        expect(Array.isArray(data.transaction_output)).toBe(true);

        const txOutput = data.transaction_output as Array<any>;
        expect(txOutput.length).toBeGreaterThan(0);

        const firstTx = txOutput[0];
        expect(firstTx.fee_estimation.details.overall_fee).toBeDefined();
        expect(firstTx.resource_bounds.l1_gas.max_amount).toBeDefined();
      }
    });

    it('should successfully simulate deploy with unique flag', async () => {
      const onchainWrite = getOnchainWrite();
      const accountAddress = process.env.STARKNET_ACCOUNT_ADDRESS;

      if (!accountAddress) {
        throw new Error(
          'STARKNET_ACCOUNT_ADDRESS must be set in environment variables'
        );
      }

      const salt = hash.computePoseidonHashOnElements([131415, 161718]);

      const params: SimulateDeployTransactionParams = {
        accountAddress,
        payloads: [
          {
            classHash: ERC20_CLASS_HASH,
            salt: salt,
            unique: true,
            constructorCalldata: [],
          },
        ],
      };

      const result = await simulateDeployTransaction(onchainWrite, params);

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.transaction_output).toBeDefined();
        expect(Array.isArray(data.transaction_output)).toBe(true);

        const txOutput = data.transaction_output as Array<any>;
        expect(txOutput.length).toBeGreaterThan(0);
      }
    });

    it('should successfully simulate multiple deploy transactions', async () => {
      const onchainWrite = getOnchainWrite();
      const accountAddress = process.env.STARKNET_ACCOUNT_ADDRESS;

      if (!accountAddress) {
        throw new Error(
          'STARKNET_ACCOUNT_ADDRESS must be set in environment variables'
        );
      }

      const salt1 = hash.computePoseidonHashOnElements([200, 300]);
      const salt2 = hash.computePoseidonHashOnElements([400, 500]);

      const params: SimulateDeployTransactionParams = {
        accountAddress,
        payloads: [
          {
            classHash: ERC20_CLASS_HASH,
            salt: salt1,
            unique: false,
            constructorCalldata: [],
          },
          {
            classHash: ERC20_CLASS_HASH,
            salt: salt2,
            unique: false,
            constructorCalldata: [],
          },
        ],
      };

      const result = await simulateDeployTransaction(onchainWrite, params);

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
  });
});
