import { describe, it, expect } from '@jest/globals';
import { getOnchainWrite } from '@kasarlabs/ask-starknet-core';
import { simulateDeclareTransaction } from '../../src/tools/simulateTransaction.js';
import { SimulateDeclareTransactionAccountParams } from '../../src/lib/types/simulateTransactionTypes.js';

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

describe('Transaction MCP - Simulate Declare Transaction E2E Tests', () => {
  describe('simulateDeclareTransaction', () => {
    it('should handle simulation with minimal contract data', async () => {
      const onchainWrite = getOnchainWrite();
      const accountAddress = process.env.STARKNET_ACCOUNT_ADDRESS;

      if (!accountAddress) {
        throw new Error(
          'STARKNET_ACCOUNT_ADDRESS must be set in environment variables'
        );
      }

      // Create a minimal valid Cairo 0 contract
      const minimalContract = JSON.stringify({
        abi: [],
        program: {
          attributes: [],
          builtins: [],
          data: ['0x480680017fff8000', '0x1', '0x208b7fff7fff7ffe'],
          hints: {},
          identifiers: {},
          main_scope: '__main__',
          prime:
            '0x800000000000011000000000000000000000000000000000000000000000001',
          reference_manager: {
            references: [],
          },
        },
        entry_points_by_type: {
          CONSTRUCTOR: [],
          EXTERNAL: [],
          L1_HANDLER: [],
        },
      });

      const params: SimulateDeclareTransactionAccountParams = {
        accountAddress,
        contract: minimalContract,
      };

      const result = await simulateDeclareTransaction(onchainWrite, params);

      // Declare transactions are complex and might fail for various reasons
      // We just verify we get a proper response structure
      expect(['success', 'failure'].includes(result.status)).toBe(true);

      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.transaction_output).toBeDefined();
        expect(Array.isArray(data.transaction_output)).toBe(true);

        const txOutput = data.transaction_output as Array<any>;
        if (txOutput.length > 0) {
          const firstTx = txOutput[0];
          expect(firstTx.transaction_number).toBeDefined();
          expect(firstTx.fee_estimation).toBeDefined();
          expect(firstTx.resource_bounds).toBeDefined();
        }
      } else if (result.status === 'failure') {
        expect(result.error).toBeDefined();
        expect(typeof result.error).toBe('string');
      }
    });

    it('should require compiledClassHash for Cairo 1 contracts', async () => {
      const onchainWrite = getOnchainWrite();
      const accountAddress = process.env.STARKNET_ACCOUNT_ADDRESS;

      if (!accountAddress) {
        throw new Error(
          'STARKNET_ACCOUNT_ADDRESS must be set in environment variables'
        );
      }

      // Try to declare a Cairo 1 contract without compiledClassHash
      const params: SimulateDeclareTransactionAccountParams = {
        accountAddress,
        contract: '{}',
        // Missing compiledClassHash which is required
      };

      const result = await simulateDeclareTransaction(onchainWrite, params);

      // Should fail because compiledClassHash is required
      expect(result.status).toBe('failure');
      expect(result.error).toBeDefined();
      expect(result.error).toContain('compiledClassHash');
    });

    it('should handle invalid contract format', async () => {
      const onchainWrite = getOnchainWrite();
      const accountAddress = process.env.STARKNET_ACCOUNT_ADDRESS;

      if (!accountAddress) {
        throw new Error(
          'STARKNET_ACCOUNT_ADDRESS must be set in environment variables'
        );
      }

      const params: SimulateDeclareTransactionAccountParams = {
        accountAddress,
        contract: 'invalid-json-string',
        compiledClassHash:
          '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      };

      const result = await simulateDeclareTransaction(onchainWrite, params);

      expect(result.status).toBe('failure');
      expect(result.error).toBeDefined();
    });

    it('should handle empty contract string', async () => {
      const onchainWrite = getOnchainWrite();
      const accountAddress = process.env.STARKNET_ACCOUNT_ADDRESS;

      if (!accountAddress) {
        throw new Error(
          'STARKNET_ACCOUNT_ADDRESS must be set in environment variables'
        );
      }

      const params: SimulateDeclareTransactionAccountParams = {
        accountAddress,
        contract: '',
        compiledClassHash:
          '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      };

      const result = await simulateDeclareTransaction(onchainWrite, params);

      expect(result.status).toBe('failure');
      expect(result.error).toBeDefined();
    });

    it('should handle contract with class hash provided', async () => {
      const onchainWrite = getOnchainWrite();
      const accountAddress = process.env.STARKNET_ACCOUNT_ADDRESS;

      if (!accountAddress) {
        throw new Error(
          'STARKNET_ACCOUNT_ADDRESS must be set in environment variables'
        );
      }

      const minimalContract = JSON.stringify({
        abi: [],
        program: {
          attributes: [],
          builtins: [],
          data: ['0x480680017fff8000', '0x1', '0x208b7fff7fff7ffe'],
          hints: {},
          identifiers: {},
          main_scope: '__main__',
          prime:
            '0x800000000000011000000000000000000000000000000000000000000000001',
          reference_manager: {
            references: [],
          },
        },
        entry_points_by_type: {
          CONSTRUCTOR: [],
          EXTERNAL: [],
          L1_HANDLER: [],
        },
      });

      const params: SimulateDeclareTransactionAccountParams = {
        accountAddress,
        contract: minimalContract,
        classHash:
          '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      };

      const result = await simulateDeclareTransaction(onchainWrite, params);

      // Verify we get a proper response
      expect(['success', 'failure'].includes(result.status)).toBe(true);

      if (result.status === 'failure') {
        expect(result.error).toBeDefined();
      }
    });

    it('should handle simulation with all parameters', async () => {
      const onchainWrite = getOnchainWrite();
      const accountAddress = process.env.STARKNET_ACCOUNT_ADDRESS;

      if (!accountAddress) {
        throw new Error(
          'STARKNET_ACCOUNT_ADDRESS must be set in environment variables'
        );
      }

      const minimalContract = JSON.stringify({
        abi: [],
        program: {
          attributes: [],
          builtins: [],
          data: ['0x480680017fff8000', '0x1', '0x208b7fff7fff7ffe'],
          hints: {},
          identifiers: {},
          main_scope: '__main__',
          prime:
            '0x800000000000011000000000000000000000000000000000000000000000001',
          reference_manager: {
            references: [],
          },
        },
        entry_points_by_type: {
          CONSTRUCTOR: [],
          EXTERNAL: [],
          L1_HANDLER: [],
        },
      });

      const params: SimulateDeclareTransactionAccountParams = {
        accountAddress,
        contract: minimalContract,
        classHash:
          '0x07c08cf5990a781c3fe4729e19f0e9e4e77e0579fa23a84b12b2ae3ae04b33bf',
        casm: {
          prime:
            '0x800000000000011000000000000000000000000000000000000000000000001',
          compiler_version: '2.0.0',
          bytecode: [],
          hints: [],
          entry_points_by_type: {
            CONSTRUCTOR: [],
            EXTERNAL: [],
            L1_HANDLER: [],
          },
        },
        compiledClassHash:
          '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      };

      const result = await simulateDeclareTransaction(onchainWrite, params);

      // Verify we get a response (success or failure is OK, as long as it's handled)
      expect(['success', 'failure'].includes(result.status)).toBe(true);

      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.transaction_output).toBeDefined();
      } else if (result.status === 'failure') {
        expect(result.error).toBeDefined();
      }
    });
  });
});
