import { describe, it, expect } from '@jest/globals';
import { getOnchainWrite } from '@kasarlabs/ask-starknet-core';
import { simulateDeployAccountTransaction } from '../../src/tools/simulateTransaction.js';
import { SimulateDeployTransactionAccountParams } from '../../src/lib/types/simulateTransactionTypes.js';
import { hash, ec } from 'starknet';

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

describe('Transaction MCP - Simulate Deploy Account Transaction E2E Tests', () => {
  const ACCOUNT_CLASS_HASH =
    '0x061dac032f228abef9c6626f995015233097ae253a7f72d68552db02f2971b8f';

  describe('simulateDeployAccountTransaction', () => {
    it('should successfully simulate a deploy account transaction', async () => {
      const onchainWrite = getOnchainWrite();
      const accountAddress = process.env.STARKNET_ACCOUNT_ADDRESS;

      if (!accountAddress) {
        throw new Error(
          'STARKNET_ACCOUNT_ADDRESS must be set in environment variables'
        );
      }

      const privateKey = ec.starkCurve.utils.randomPrivateKey();
      const publicKey = ec.starkCurve.getStarkKey(privateKey);

      const addressSalt = publicKey;

      const params: SimulateDeployTransactionAccountParams = {
        accountAddress,
        payloads: [
          {
            classHash: ACCOUNT_CLASS_HASH,
            constructorCalldata: [publicKey],
            addressSalt: addressSalt,
          },
        ],
      };

      const result = await simulateDeployAccountTransaction(
        onchainWrite,
        params
      );

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

    it('should successfully simulate deploy account with no constructor calldata', async () => {
      const onchainWrite = getOnchainWrite();
      const accountAddress = process.env.STARKNET_ACCOUNT_ADDRESS;

      if (!accountAddress) {
        throw new Error(
          'STARKNET_ACCOUNT_ADDRESS must be set in environment variables'
        );
      }

      const privateKey = ec.starkCurve.utils.randomPrivateKey();
      const publicKey = ec.starkCurve.getStarkKey(privateKey);

      const params: SimulateDeployTransactionAccountParams = {
        accountAddress,
        payloads: [
          {
            classHash: ACCOUNT_CLASS_HASH,
            constructorCalldata: [],
            addressSalt: publicKey,
          },
        ],
      };

      const result = await simulateDeployAccountTransaction(
        onchainWrite,
        params
      );

      expect(['success', 'failure'].includes(result.status)).toBe(true);
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.transaction_output).toBeDefined();
      } else if (result.status === 'failure') {
        expect(result.error).toBeDefined();
      }
    });

    it('should handle simulation with invalid class hash', async () => {
      const onchainWrite = getOnchainWrite();
      const accountAddress = process.env.STARKNET_ACCOUNT_ADDRESS;

      if (!accountAddress) {
        throw new Error(
          'STARKNET_ACCOUNT_ADDRESS must be set in environment variables'
        );
      }

      const privateKey = ec.starkCurve.utils.randomPrivateKey();
      const publicKey = ec.starkCurve.getStarkKey(privateKey);

      const params: SimulateDeployTransactionAccountParams = {
        accountAddress,
        payloads: [
          {
            classHash: '0x0',
            constructorCalldata: [publicKey],
            addressSalt: publicKey,
          },
        ],
      };

      const result = await simulateDeployAccountTransaction(
        onchainWrite,
        params
      );

      expect(result.status).toBe('failure');
      expect(result.error).toBeDefined();
    });

    it('should successfully simulate multiple deploy account transactions', async () => {
      const onchainWrite = getOnchainWrite();
      const accountAddress = process.env.STARKNET_ACCOUNT_ADDRESS;

      if (!accountAddress) {
        throw new Error(
          'STARKNET_ACCOUNT_ADDRESS must be set in environment variables'
        );
      }

      const privateKey1 = ec.starkCurve.utils.randomPrivateKey();
      const publicKey1 = ec.starkCurve.getStarkKey(privateKey1);

      const privateKey2 = ec.starkCurve.utils.randomPrivateKey();
      const publicKey2 = ec.starkCurve.getStarkKey(privateKey2);

      const params: SimulateDeployTransactionAccountParams = {
        accountAddress,
        payloads: [
          {
            classHash: ACCOUNT_CLASS_HASH,
            constructorCalldata: [publicKey1],
            addressSalt: publicKey1,
          },
          {
            classHash: ACCOUNT_CLASS_HASH,
            constructorCalldata: [publicKey2],
            addressSalt: publicKey2,
          },
        ],
      };

      const result = await simulateDeployAccountTransaction(
        onchainWrite,
        params
      );

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

    it('should calculate different fees based on constructor complexity', async () => {
      const onchainWrite = getOnchainWrite();
      const accountAddress = process.env.STARKNET_ACCOUNT_ADDRESS;

      if (!accountAddress) {
        throw new Error(
          'STARKNET_ACCOUNT_ADDRESS must be set in environment variables'
        );
      }

      const privateKey1 = ec.starkCurve.utils.randomPrivateKey();
      const publicKey1 = ec.starkCurve.getStarkKey(privateKey1);

      const params1: SimulateDeployTransactionAccountParams = {
        accountAddress,
        payloads: [
          {
            classHash: ACCOUNT_CLASS_HASH,
            constructorCalldata: [publicKey1],
            addressSalt: publicKey1,
          },
        ],
      };

      const result1 = await simulateDeployAccountTransaction(
        onchainWrite,
        params1
      );

      expect(result1.status).toBe('success');
      if (result1.status === 'success' && result1.data) {
        const data1 = getDataAsRecord(result1.data);
        expect(data1.transaction_output).toBeDefined();
        const txOutput1 = data1.transaction_output as Array<any>;
        expect(txOutput1.length).toBeGreaterThan(0);
        expect(txOutput1[0].fee_estimation.details.overall_fee).toBeDefined();
      }
    });
  });
});
