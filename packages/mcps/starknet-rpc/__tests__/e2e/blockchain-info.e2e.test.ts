import { describe, it, expect } from '@jest/globals';
import { getOnchainRead } from '@kasarlabs/ask-starknet-core';
import { getChainId } from '../../src/tools/getChainId.js';
import { getBlockNumber } from '../../src/tools/getBlockNumber.js';
import { getSpecVersion } from '../../src/tools/getSpecVersion.js';
import { getSyncingStats } from '../../src/tools/getSyncingStats.js';

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

describe('Starknet RPC - Blockchain Info E2E Tests', () => {
  describe('getChainId', () => {
    it('should return the chain id', async () => {
      const onchainRead = getOnchainRead();
      const result = await getChainId(onchainRead.provider);

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.data).toBeDefined();
        const data = getDataAsRecord(result.data);
        expect(data.chainId).toBeDefined();
        expect(
          typeof data.chainId === 'string' || typeof data.chainId === 'bigint'
        ).toBe(true);
      }
    });
  });

  describe('getBlockNumber', () => {
    it('should return the current block number', async () => {
      const onchainRead = getOnchainRead();
      const result = await getBlockNumber(onchainRead.provider);

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.data).toBeDefined();
        const data = getDataAsRecord(result.data);
        expect(data.blockNumber).toBeDefined();
        expect(typeof data.blockNumber).toBe('number');
        expect(data.blockNumber).toBeGreaterThan(0);
      }
    });
  });

  describe('getSpecVersion', () => {
    it('should return the spec version', async () => {
      const onchainRead = getOnchainRead();
      const result = await getSpecVersion(onchainRead.provider);

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.data).toBeDefined();
        const data = getDataAsRecord(result.data);
        expect(data.specVersion).toBeDefined();
        expect(typeof data.specVersion).toBe('string');
      }
    });
  });

  describe('getSyncingStats', () => {
    it('should return the syncing stats', async () => {
      const onchainRead = getOnchainRead();
      const result = await getSyncingStats(onchainRead.provider);

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.data).toBeDefined();
        const data = getDataAsRecord(result.data);
        expect(data.syncingStats).toBeDefined();
        expect(['boolean', 'object'].includes(typeof data.syncingStats)).toBe(
          true
        );
      }
    });
  });
});
