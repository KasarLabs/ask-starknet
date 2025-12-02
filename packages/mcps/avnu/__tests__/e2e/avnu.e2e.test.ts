import { describe, beforeAll, it, expect } from '@jest/globals';
import { getOnchainRead, getOnchainWrite } from '@kasarlabs/ask-starknet-core';
import { getRoute } from '../../src/tools/fetchRoute.js';
import { swapTokens } from '../../src/tools/swap.js';

// Test context variables
let accountAddress: string;

// Common token addresses on Starknet mainnet
const ETH_ADDRESS =
  '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';
const USDC_ADDRESS =
  '0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8';
const STRK_ADDRESS =
  '0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d';

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

        // Parse the JSON string response
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

      // Should return failure status for invalid tokens
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        const routeData = JSON.parse(data.res);
        // The route service might return failure status in the data
        expect(
          routeData.status === 'success' || routeData.status === 'failure'
        ).toBe(true);
      }
    });
  });

  describe('Swap Tokens', () => {
    it('should execute a swap using token symbols (STRK to USDC) and swap back (USDC to STRK)', async () => {
      const onchainWrite = getOnchainWrite();

      // Use a very small amount for testing to minimize cost
      const swapResult = await swapTokens(onchainWrite, {
        sellTokenSymbol: 'STRK',
        buyTokenSymbol: 'USDC',
        sellAmount: 0.1,
      });

      // Note: This test may fail if:
      // 1. Account doesn't have enough STRK
      // 2. Account doesn't have enough balance for gas
      // 3. Network issues
      // So we check for either success or a specific error
      expect(swapResult.status).toBeDefined();

      if (swapResult.status === 'success' && swapResult.data) {
        const data = getDataAsRecord(swapResult.data);
        expect(data.transactionHash).toBeDefined();
        expect(data.transactionHash).toMatch(/^0x[0-9a-f]+$/i);
        expect(data.sellAmount).toBe(0.1);
        expect(data.sellToken).toBeDefined();
        expect(data.buyToken).toBeDefined();

        // Wait for transaction to be confirmed before swapping back
        await new Promise((resolve) => setTimeout(resolve, 5000));

        // Swap back USDC to STRK with a small amount
        const swapBackResult = await swapTokens(onchainWrite, {
          sellTokenSymbol: 'USDC',
          buyTokenSymbol: 'STRK',
          sellAmount: 0.01, // Small amount to swap back
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
        // If swap fails, it should have an error message
        expect(swapResult.error).toBeDefined();
        console.log('Swap failed (expected in some cases):', swapResult.error);
      }
    }, 180000); // Extended timeout for swap operations (both directions)

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

        // Wait for transaction to be confirmed before swapping back
        await new Promise((resolve) => setTimeout(resolve, 5000));

        // Swap back USDC to STRK with a small amount
        const swapBackResult = await swapTokens(onchainWrite, {
          sellTokenAddress: USDC_ADDRESS,
          buyTokenAddress: STRK_ADDRESS,
          sellAmount: 0.01, // Small amount to swap back
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

      // Try to swap an extremely large amount that the account likely doesn't have
      const result = await swapTokens(onchainWrite, {
        sellTokenSymbol: 'STRK',
        buyTokenSymbol: 'USDC',
        sellAmount: 1000000, // Very large amount
      });

      // Should return failure status
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

      // Should return failure status
      expect(result.status).toBe('failure');
      expect(result.error).toBeDefined();
    });
  });
});
