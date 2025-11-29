import { describe, it, expect } from '@jest/globals';
import { getOnchainRead } from '@kasarlabs/ask-starknet-core';
import { getBlockWithTxHashes } from '../../src/tools/getBlockWithTxHashes.js';
import { getBlockWithReceipts } from '../../src/tools/getBlockWithReceipts.js';
import { getBlockWithTxs } from '../../src/tools/getBlockWithTxs.js';
import { getBlockTransactionCount } from '../../src/tools/getBlockTransactionCount.js';
import { getBlockStateUpdate } from '../../src/tools/getBlockStateUpdate.js';
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

describe('Starknet RPC - Block Operations E2E Tests', () => {
  let testBlockNumber: string;

  beforeAll(async () => {
    // Get the latest block number to use in tests
    const onchainRead = getOnchainRead();
    const result = await getBlockNumber(onchainRead.provider);

    if (result.status === 'success' && result.data) {
      const data = getDataAsRecord(result.data);
      // Use a block that is a few blocks behind to ensure it's finalized
      testBlockNumber = ((data.blockNumber as number) - 10).toString();
    } else {
      throw new Error('Failed to get block number for testing');
    }
  });

  describe('getBlockWithTxHashes', () => {
    it('should return block with transaction hashes using block number', async () => {
      const onchainRead = getOnchainRead();
      const result = await getBlockWithTxHashes(onchainRead.provider, {
        blockId: testBlockNumber,
      });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.blockWithTxHashes).toBeDefined();
        expect(typeof data.blockWithTxHashes).toBe('object');
      }
    });

    it('should return block with transaction hashes using "latest" tag', async () => {
      const onchainRead = getOnchainRead();
      const result = await getBlockWithTxHashes(onchainRead.provider, {
        blockId: 'latest',
      });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.blockWithTxHashes).toBeDefined();
        expect(typeof data.blockWithTxHashes).toBe('object');
      }
    });
  });

  describe('getBlockWithTxs', () => {
    it('should return block with full transaction details', async () => {
      const onchainRead = getOnchainRead();
      const result = await getBlockWithTxs(onchainRead.provider, {
        blockId: testBlockNumber,
      });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.blockWithTxs).toBeDefined();
        expect(typeof data.blockWithTxs).toBe('object');
      }
    });
  });

  describe('getBlockWithReceipts', () => {
    it('should return block with transaction receipts', async () => {
      const onchainRead = getOnchainRead();
      const result = await getBlockWithReceipts(onchainRead.provider, {
        blockId: testBlockNumber,
      });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.blockWithReceipts).toBeDefined();
        expect(typeof data.blockWithReceipts).toBe('object');
      }
    });
  });

  describe('getBlockTransactionCount', () => {
    it('should return the transaction count of a block', async () => {
      const onchainRead = getOnchainRead();
      const result = await getBlockTransactionCount(onchainRead.provider, {
        blockId: testBlockNumber,
      });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.blockTransactionCount).toBeDefined();
        expect(typeof data.blockTransactionCount).toBe('number');
        expect(data.blockTransactionCount).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('getBlockStateUpdate', () => {
    it('should return the state update of a block', async () => {
      const onchainRead = getOnchainRead();
      const result = await getBlockStateUpdate(onchainRead.provider, {
        blockId: testBlockNumber,
      });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.blockStateUpdate).toBeDefined();
        expect(typeof data.blockStateUpdate).toBe('object');
      }
    });
  });
});
