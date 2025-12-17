import { describe, beforeAll, it, expect } from '@jest/globals';
import { getBridgeConfig } from '../../src/tools/read/getBridgeConfig.js';
import { getBridgeQuote } from '../../src/tools/read/getBridgeQuote.js';
import { ExtendedApiEnv } from '../../src/lib/types/index.js';
import { getDataAsRecord, getDataAsArray, sleep } from '../helpers.js';

describe('Extended Read Operations - Bridge', () => {
  let env: ExtendedApiEnv;
  let availableChains: string[] = [];

  beforeAll(async () => {
    const apiKey = process.env.EXTENDED_API_KEY;
    const apiUrl =
      process.env.EXTENDED_API_URL || 'https://api.starknet.extended.exchange';

    if (!apiKey) {
      throw new Error('EXTENDED_API_KEY must be set in environment variables');
    }

    env = {
      apiKey,
      apiUrl,
      privateKey: process.env.EXTENDED_PRIVATE_KEY,
    };

    // Get available chains for testing
    const configResult = await getBridgeConfig(env);
    await sleep(2000);
    if (configResult.status === 'success' && configResult.data) {
      const config = getDataAsRecord(configResult.data);
      if (config.chains && Array.isArray(config.chains)) {
        availableChains = config.chains.map((chain: any) => chain.chain);
      }
    }
  });

  describe('Bridge Configuration', () => {
    it('should get bridge configuration', async () => {
      const result = await getBridgeConfig(env);
      await sleep(2000);

      expect(result.status).toBe('success');
      expect(result.data).toBeDefined();
      if (result.status === 'success' && result.data) {
        const config = getDataAsRecord(result.data);
        expect(config).toHaveProperty('chains');
        expect(Array.isArray(config.chains)).toBe(true);

        // If chains exist, verify structure
        if (config.chains.length > 0) {
          const chain = config.chains[0];
          expect(chain).toHaveProperty('chain');
          expect(chain).toHaveProperty('contractAddress');
          expect(typeof chain.chain).toBe('string');
          expect(typeof chain.contractAddress).toBe('string');
          expect(chain.contractAddress).toMatch(/^0x[0-9a-f]+$/i);
        }
      }
    });
  });

  describe('Bridge Quote', () => {
    it('should get bridge quote for deposit', async () => {
      // Need at least one chain to test
      if (availableChains.length === 0) {
        console.log('Skipping bridge quote test - no chains available');
        return;
      }

      const chainIn = availableChains[0];
      // Try different possible values for Starknet chain identifier
      const starknetId = 'STRK';
      let result: any;
      result = await getBridgeQuote(env, {
        chain_in: chainIn,
        chain_out: starknetId,
        amount: 10,
      });
      await sleep(2000);

      expect(result.status).toBe('success');
      expect(result.data).toBeDefined();
      if (result.status === 'success' && result.data) {
        const quote = getDataAsRecord(result.data);
        expect(quote).toHaveProperty('id');
        expect(quote).toHaveProperty('fee');
        expect(typeof quote.id).toBe('string');
        expect(typeof quote.fee).toBe('string');
      }
    });

    it('should get bridge quote for withdrawal', async () => {
      // Need at least one chain to test
      if (availableChains.length === 0) {
        console.log('Skipping bridge quote test - no chains available');
        return;
      }

      const starknetId = 'STRK';
      let result: any;

      result = await getBridgeQuote(env, {
        chain_in: starknetId,
        chain_out: availableChains[0],
        amount: 100,
      });
      await sleep(2000);

      expect(result.status).toBe('success');
      expect(result.data).toBeDefined();
      if (result.status === 'success' && result.data) {
        const quote = getDataAsRecord(result.data);
        expect(quote).toHaveProperty('id');
        expect(quote).toHaveProperty('fee');
        expect(typeof quote.id).toBe('string');
        expect(typeof quote.fee).toBe('string');
      }
    });

    it('should handle bridge quote with different amounts', async () => {
      // Need at least one chain to test
      if (availableChains.length === 0) {
        console.log('Skipping bridge quote test - no chains available');
        return;
      }

      const chainIn = availableChains[0];
      const starknetId = 'STRK';

      const amounts = [10, 100, 1000]; // Different amounts in USD

      for (const amount of amounts) {
        const result = await getBridgeQuote(env, {
          chain_in: chainIn,
          chain_out: starknetId,
          amount,
        });
        await sleep(2000);

        expect(result.status).toBe('success');
        expect(result.data).toBeDefined();
        if (result.status === 'success' && result.data) {
          const quote = getDataAsRecord(result.data);
          expect(quote).toHaveProperty('id');
          expect(quote).toHaveProperty('fee');
        }
      }
    });
  });
});
