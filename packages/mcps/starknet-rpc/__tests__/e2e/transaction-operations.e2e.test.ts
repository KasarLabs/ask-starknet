import { describe, it, expect, beforeAll } from '@jest/globals';
import { getOnchainRead } from '@kasarlabs/ask-starknet-core';
import { getTransactionByHash } from '../../src/tools/getTransactionByHash.js';
import { getTransactionReceipt } from '../../src/tools/getTransactionReceipt.js';
import { getTransactionStatus } from '../../src/tools/getTransactionStatus.js';
import { getTransactionTrace } from '../../src/tools/getTransactionTrace.js';
import { getTransactionByBlockIdAndIndex } from '../../src/tools/getTransactionByBlockIdAndIndex.js';
import { getBlockWithTxHashes } from '../../src/tools/getBlockWithTxHashes.js';
import { getBlockNumber } from '../../src/tools/getBlockNumber.js';

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

describe('Starknet RPC - Transaction Operations E2E Tests', () => {
  let testTransactionHash: string;
  let testBlockNumber: string;

  beforeAll(async () => {
    const onchainRead = getOnchainRead();

    const blockNumberResult = await getBlockNumber(onchainRead.provider);
    if (blockNumberResult.status !== 'success' || !blockNumberResult.data) {
      throw new Error('Failed to get block number for testing');
    }
    const currentBlockNumber = getDataAsRecord(blockNumberResult.data)
      .blockNumber as number;

    for (let i = 0; i < 100; i++) {
      const blockNum = (currentBlockNumber - i).toString();
      const blockResult = await getBlockWithTxHashes(onchainRead.provider, {
        blockId: blockNum,
      });

      if (blockResult.status === 'success' && blockResult.data) {
        const blockData = getDataAsRecord(blockResult.data);
        const block = blockData.blockWithTxHashes as any;

        if (
          block &&
          block.transactions &&
          Array.isArray(block.transactions) &&
          block.transactions.length > 0
        ) {
          testTransactionHash = block.transactions[0];
          testBlockNumber = blockNum;
          break;
        }
      }
    }

    if (!testTransactionHash) {
      throw new Error('Could not find a block with transactions for testing');
    }
  });

  describe('getTransactionByHash', () => {
    it('should return transaction details by hash', async () => {
      const onchainRead = getOnchainRead();
      const result = await getTransactionByHash(onchainRead.provider, {
        transactionHash: testTransactionHash,
      });

      expect(result.status).toBe('success');
      expect(result.data).toBeDefined();
      const data = getDataAsRecord(result.data);
      expect(data.transaction).toBeDefined();
      expect(typeof data.transaction).toBe('object');
    });
  });

  describe('getTransactionReceipt', () => {
    it('should return transaction receipt by hash', async () => {
      const onchainRead = getOnchainRead();
      const result = await getTransactionReceipt(onchainRead.provider, {
        transactionHash: testTransactionHash,
      });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.transactionReceipt).toBeDefined();
        expect(typeof data.transactionReceipt).toBe('object');
      }
    });
  });

  describe('getTransactionStatus', () => {
    it('should return transaction status by hash', async () => {
      const onchainRead = getOnchainRead();
      const result = await getTransactionStatus(onchainRead.provider, {
        transactionHash: testTransactionHash,
      });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.transactionStatus).toBeDefined();
        expect(typeof data.transactionStatus).toBe('object');
      }
    });
  });

  describe('getTransactionTrace', () => {
    it('should return transaction trace by hash', async () => {
      const onchainRead = getOnchainRead();
      const result = await getTransactionTrace(onchainRead.provider, {
        transactionHash: testTransactionHash,
      });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.transactionTrace).toBeDefined();
        expect(typeof data.transactionTrace).toBe('object');
      }
    });
  });

  describe('getTransactionByBlockIdAndIndex', () => {
    it('should return transaction by block ID and index', async () => {
      const onchainRead = getOnchainRead();
      const result = await getTransactionByBlockIdAndIndex(
        onchainRead.provider,
        {
          blockId: testBlockNumber,
          index: 0,
        }
      );

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.transaction).toBeDefined();
        expect(typeof data.transaction).toBe('object');
      }
    });
  });
});
