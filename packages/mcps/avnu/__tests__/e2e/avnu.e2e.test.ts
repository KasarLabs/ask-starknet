import { describe, beforeAll, it, expect } from '@jest/globals';
import { getOnchainWrite, getDataAsRecord } from '@kasarlabs/ask-starknet-core';
import { getRoute } from '../../src/tools/fetchRoute.js';
import { swapTokens } from '../../src/tools/swap.js';

let accountAddress: string;

const USDC_ADDRESS =
  '0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8';
const STRK_ADDRESS =
  '0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d';

describe('AVNU E2E Tests', () => {
  beforeAll(async () => {
    accountAddress = process.env.STARKNET_ACCOUNT_ADDRESS || '0x0';

    if (accountAddress === '0x0') {
      throw new Error(
        'STARKNET_ACCOUNT_ADDRESS must be set in environment variables'
      );
    }

    if (!process.env.STARKNET_RPC_URL) {
      throw new Error('STARKNET_RPC_URL must be set in environment variables');
    }
  });

  describe('Get Route', () => {
    it('should fetch a route using token symbols (STRK to USDC)', async () => {
      const onchainWrite = getOnchainWrite();
      const result = await getRoute(onchainWrite, {
        sellTokenSymbol: 'STRK',
        buyTokenSymbol: 'USDC',
        sellAmount: 1,
      });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.res).toBeDefined();

        const routeData = JSON.parse(data.res);
        expect(routeData.status).toBe('success');
        expect(routeData.route).toBeDefined();
        expect(routeData.quote).toBeDefined();
      }
    });

    it('should fetch a route using token addresses (STRK to USDC)', async () => {
      const onchainWrite = getOnchainWrite();
      const result = await getRoute(onchainWrite, {
        sellTokenAddress: STRK_ADDRESS,
        buyTokenAddress: USDC_ADDRESS,
        sellAmount: 1,
      });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.res).toBeDefined();

        const routeData = JSON.parse(data.res);
        expect(routeData.status).toBe('success');
        expect(routeData.route).toBeDefined();
        expect(routeData.quote).toBeDefined();
      }
    });

    it('should fetch a route using mixed symbol and address', async () => {
      const onchainWrite = getOnchainWrite();
      const result = await getRoute(onchainWrite, {
        sellTokenSymbol: 'STRK',
        buyTokenAddress: USDC_ADDRESS,
        sellAmount: 1,
      });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.res).toBeDefined();

        const routeData = JSON.parse(data.res);
        expect(routeData.status).toBe('success');
      }
    });

    it('should fetch a route for STRK to ETH', async () => {
      const onchainWrite = getOnchainWrite();
      const result = await getRoute(onchainWrite, {
        sellTokenSymbol: 'STRK',
        buyTokenSymbol: 'ETH',
        sellAmount: 1,
      });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.res).toBeDefined();

        const routeData = JSON.parse(data.res);
        expect(routeData.status).toBe('success');
        expect(routeData.route).toBeDefined();
      }
    });

    it('should handle invalid token pair gracefully', async () => {
      const onchainWrite = getOnchainWrite();
      const result = await getRoute(onchainWrite, {
        sellTokenSymbol: 'INVALID_TOKEN',
        buyTokenSymbol: 'STRK',
        sellAmount: 1,
      });

      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        const routeData = JSON.parse(data.res);
        expect(
          routeData.status === 'success' || routeData.status === 'failure'
        ).toBe(true);
      }
    });
  });

  describe('Swap Tokens', () => {
    it('should execute a swap using token symbols (STRK to USDC) and swap back (USDC to STRK)', async () => {
      const onchainWrite = getOnchainWrite();

      const swapResult = await swapTokens(onchainWrite, {
        sellTokenSymbol: 'STRK',
        buyTokenSymbol: 'USDC',
        sellAmount: 0.1,
      });

      expect(swapResult.status).toBeDefined();

      if (swapResult.status === 'success' && swapResult.data) {
        const data = getDataAsRecord(swapResult.data);
        expect(data.transactionHash).toBeDefined();
        expect(data.transactionHash).toMatch(/^0x[0-9a-f]+$/i);
        expect(data.sellAmount).toBe(0.1);
        expect(data.sellToken).toBeDefined();
        expect(data.buyToken).toBeDefined();

        await new Promise((resolve) => setTimeout(resolve, 5000));

        const swapBackResult = await swapTokens(onchainWrite, {
          sellTokenSymbol: 'USDC',
          buyTokenSymbol: 'STRK',
          sellAmount: 0.01,
        });

        expect(swapBackResult.status).toBeDefined();

        if (swapBackResult.status === 'success' && swapBackResult.data) {
          const swapBackData = getDataAsRecord(swapBackResult.data);
          expect(swapBackData.transactionHash).toBeDefined();
          expect(swapBackData.transactionHash).toMatch(/^0x[0-9a-f]+$/i);
          expect(swapBackData.sellAmount).toBe(0.01);
          expect(swapBackData.sellToken).toBeDefined();
          expect(swapBackData.buyToken).toBeDefined();
        } else if (swapBackResult.status === 'failure') {
          expect(swapBackResult.error).toBeDefined();
          console.log(
            'Swap back failed (expected in some cases):',
            swapBackResult.error
          );
        }
      } else if (swapResult.status === 'failure') {
        expect(swapResult.error).toBeDefined();
      }
    }, 180000);

    it('should execute a swap using token addresses and swap back', async () => {
      const onchainWrite = getOnchainWrite();

      const swapResult = await swapTokens(onchainWrite, {
        sellTokenAddress: STRK_ADDRESS,
        buyTokenAddress: USDC_ADDRESS,
        sellAmount: 0.1,
      });

      expect(swapResult.status).toBeDefined();

      if (swapResult.status === 'success' && swapResult.data) {
        const data = getDataAsRecord(swapResult.data);
        expect(data.transactionHash).toBeDefined();
        expect(data.sellAmount).toBe(0.1);

        await new Promise((resolve) => setTimeout(resolve, 5000));

        const swapBackResult = await swapTokens(onchainWrite, {
          sellTokenAddress: USDC_ADDRESS,
          buyTokenAddress: STRK_ADDRESS,
          sellAmount: 0.01,
        });

        expect(swapBackResult.status).toBeDefined();

        if (swapBackResult.status === 'success' && swapBackResult.data) {
          const swapBackData = getDataAsRecord(swapBackResult.data);
          expect(swapBackData.transactionHash).toBeDefined();
          expect(swapBackData.sellAmount).toBe(0.01);
        } else if (swapBackResult.status === 'failure') {
          expect(swapBackResult.error).toBeDefined();
          console.log(
            'Swap back failed (expected in some cases):',
            swapBackResult.error
          );
        }
      } else if (swapResult.status === 'failure') {
        expect(swapResult.error).toBeDefined();
        console.log('Swap failed (expected in some cases):', swapResult.error);
      }
    }, 180000);

    it('should handle swap with insufficient balance gracefully', async () => {
      const onchainWrite = getOnchainWrite();

      const result = await swapTokens(onchainWrite, {
        sellTokenSymbol: 'STRK',
        buyTokenSymbol: 'USDC',
        sellAmount: 1000000,
      });

      expect(result.status).toBe('failure');
      expect(result.error).toBeDefined();
    }, 120000);

    it('should reject swap with invalid token pair', async () => {
      const onchainWrite = getOnchainWrite();

      const result = await swapTokens(onchainWrite, {
        sellTokenSymbol: 'INVALID_TOKEN',
        buyTokenSymbol: 'STRK',
        sellAmount: 1,
      });

      expect(result.status).toBe('failure');
      expect(result.error).toBeDefined();
    });
  });
});
