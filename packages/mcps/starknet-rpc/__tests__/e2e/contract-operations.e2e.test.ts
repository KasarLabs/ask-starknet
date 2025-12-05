import { describe, it, expect, beforeAll } from '@jest/globals';
import { getOnchainRead } from '@kasarlabs/ask-starknet-core';
import { getClass } from '../../src/tools/getClass.js';
import { getClassAt } from '../../src/tools/getClassAt.js';
import { getClassHashAt } from '../../src/tools/getClassHashAt.js';
import { getStorageAt } from '../../src/tools/getStorageAt.js';
import { getNonceForAddress } from '../../src/tools/getNonceForAddress.js';

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

describe('Starknet RPC - Contract Operations E2E Tests', () => {
  const ETH_TOKEN_ADDRESS =
    '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';
  let testAccountAddress: string;

  beforeAll(async () => {
    testAccountAddress =
      process.env.STARKNET_ACCOUNT_ADDRESS ||
      '0x0000000000000000000000000000000000000000000000000000000000000001';

    if (!testAccountAddress || testAccountAddress === '0x0') {
      console.warn(
        'STARKNET_ACCOUNT_ADDRESS not set, using default test address'
      );
    }
  });

  describe('getClassHashAt', () => {
    it('should return the class hash of a contract', async () => {
      const onchainRead = getOnchainRead();
      const result = await getClassHashAt(onchainRead.provider, {
        contractAddress: ETH_TOKEN_ADDRESS,
        blockId: 'latest',
      });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.classHash).toBeDefined();
        expect(typeof data.classHash).toBe('string');
        expect(data.classHash.startsWith('0x')).toBe(true);
      }
    });
  });

  describe('getClassAt', () => {
    it('should return the class definition at a contract address', async () => {
      const onchainRead = getOnchainRead();
      const result = await getClassAt(onchainRead.provider, {
        contractAddress: ETH_TOKEN_ADDRESS,
        blockId: 'latest',
      });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.contractClass).toBeDefined();
        expect(typeof data.contractClass).toBe('object');
      }
    });
  });

  describe('getClass', () => {
    it('should return the class definition by class hash', async () => {
      const onchainRead = getOnchainRead();

      const classHashResult = await getClassHashAt(onchainRead.provider, {
        contractAddress: ETH_TOKEN_ADDRESS,
        blockId: 'latest',
      });

      if (classHashResult.status !== 'success' || !classHashResult.data) {
        throw new Error('Failed to get class hash for testing');
      }

      const classHash = getDataAsRecord(classHashResult.data)
        .classHash as string;

      const result = await getClass(onchainRead.provider, {
        classHash: classHash,
        blockId: 'latest',
      });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.contractClass).toBeDefined();
        expect(typeof data.contractClass).toBe('object');
      }
    });
  });

  describe('getStorageAt', () => {
    it('should return storage value at a specific key', async () => {
      const onchainRead = getOnchainRead();
      const result = await getStorageAt(onchainRead.provider, {
        contractAddress: ETH_TOKEN_ADDRESS,
        key: '0x0',
        blockId: 'latest',
      });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.storageValue).toBeDefined();
        expect(typeof data.storageValue).toBe('string');
      }
    });
  });

  describe('getNonceForAddress', () => {
    it('should return the nonce for an account address', async () => {
      const onchainRead = getOnchainRead();
      const result = await getNonceForAddress(onchainRead.provider, {
        contractAddress: testAccountAddress,
        blockId: 'latest',
      });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.nonce).toBeDefined();
        expect(typeof data.nonce).toBe('string');
      }
    });

    it('should return nonce 0 for ETH token contract (not an account)', async () => {
      const onchainRead = getOnchainRead();
      const result = await getNonceForAddress(onchainRead.provider, {
        contractAddress: ETH_TOKEN_ADDRESS,
        blockId: 'latest',
      });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.nonce).toBeDefined();
        expect(data.nonce).toBe('0x0');
      }
    });
  });
});
