import { describe, beforeAll, it, expect } from '@jest/globals';
import {
  getOnchainWrite,
  getDataAsRecord,
  getERC20Balance,
} from '@kasarlabs/ask-starknet-core';
import { getRouteFibrous } from '../../src/tools/fetchRoute.js';
import { swapTokensFibrous } from '../../src/tools/swap.js';
import { batchSwapTokens } from '../../src/tools/batchSwap.js';
import { TokenService } from '../../src/tools/fetchTokens.js';

function formatBalance(balance: bigint, decimals: number): string {
  const divisor = BigInt(10) ** BigInt(decimals);
  const whole = balance / divisor;
  const fraction = balance % divisor;
  if (fraction === 0n) return whole.toString();
  const fractionStr = fraction.toString().padStart(decimals, '0');
  const trimmed = fractionStr.replace(/0+$/, '');
  return trimmed ? `${whole}.${trimmed}` : whole.toString();
}

async function getAmountReceivedHumanUnits(params: {
  provider: any;
  tokenAddress: string;
  accountAddress: string;
  balanceBefore: bigint;
  decimals: number;
}): Promise<string> {
  const balanceAfter = await getERC20Balance(
    params.provider,
    params.tokenAddress,
    params.accountAddress
  );

  const delta = balanceAfter - params.balanceBefore;
  if (delta <= 0n) {
    throw new Error('No tokens received from swap');
  }
  return formatBalance(delta, params.decimals);
}

describe('Fibrous E2E Tests', () => {
  beforeAll(async () => {
    if (!process.env.STARKNET_ACCOUNT_ADDRESS) {
      throw new Error(
        'STARKNET_ACCOUNT_ADDRESS must be set in environment variables'
      );
    }
    if (!process.env.STARKNET_RPC_URL) {
      throw new Error('STARKNET_RPC_URL must be set in environment variables');
    }
    if (!process.env.STARKNET_PRIVATE_KEY) {
      throw new Error(
        'STARKNET_PRIVATE_KEY must be set in environment variables'
      );
    }
  });

  describe('Get Route', () => {
    it('should fetch a route (STRK -> USDC)', async () => {
      const result = await getRouteFibrous({
        sellTokenSymbol: 'STRK',
        buyTokenSymbol: 'USDC',
        sellAmount: 0.05,
      });

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.route).toBeDefined();
      }
    });
  });

  describe('Swap (round-trip)', () => {
    it('should swap STRK -> USDC (amountIn) and swap back USDC -> STRK using the exact amount received', async () => {
      const onchainWrite = getOnchainWrite();
      const provider = onchainWrite.provider;
      const accountAddress = onchainWrite.account.address;

      const tokenService = new TokenService();
      await tokenService.initializeTokens();
      const usdcToken = tokenService.getToken('USDC');
      if (!usdcToken) {
        throw new Error('USDC token not supported by Fibrous on Starknet');
      }

      const usdcBefore = await getERC20Balance(
        provider,
        usdcToken.address,
        accountAddress
      );

      const swapResult = await swapTokensFibrous(onchainWrite, {
        sellTokenSymbol: 'STRK',
        buyTokenSymbol: 'USDC',
        sellAmount: 10,
      });

      expect(swapResult.status).toBe('success');
      if (swapResult.status === 'failure') {
        throw new Error(swapResult.error || 'Swap failed');
      }

      const swapData = getDataAsRecord((swapResult as any).data || swapResult);
      expect(swapData.transactionHash).toBeDefined();
      expect(String(swapData.transactionHash)).toMatch(/^0x[0-9a-f]+$/i);

      await new Promise((resolve) => setTimeout(resolve, 10000));

      const receivedUsdc = await getAmountReceivedHumanUnits({
        provider,
        tokenAddress: usdcToken.address,
        accountAddress,
        balanceBefore: usdcBefore,
        decimals: Number(usdcToken.decimals),
      });

      const swapBackResult = await swapTokensFibrous(onchainWrite, {
        sellTokenSymbol: 'USDC',
        buyTokenSymbol: 'STRK',
        sellAmount: Number(receivedUsdc),
      });

      expect(swapBackResult.status).toBe('success');
      if (swapBackResult.status === 'failure') {
        throw new Error(swapBackResult.error || 'Swap back failed');
      }
    }, 180000);
  });

  describe('Batch swap (multi-input to single-output)', () => {
    it('should swap STRK -> ETH, STRK -> USDC, then batchSwap ETH + USDC -> STRK', async () => {
      const onchainWrite = getOnchainWrite();
      const provider = onchainWrite.provider;
      const accountAddress = onchainWrite.account.address;

      const tokenService = new TokenService();
      await tokenService.initializeTokens();
      const ethToken = tokenService.getToken('ETH');
      const usdcToken = tokenService.getToken('USDC');
      if (!ethToken) {
        throw new Error('ETH token not supported by Fibrous on Starknet');
      }
      if (!usdcToken) {
        throw new Error('USDC token not supported by Fibrous on Starknet');
      }

      const usdcBefore = await getERC20Balance(
        provider,
        usdcToken.address,
        accountAddress
      );
      const ethBefore = await getERC20Balance(
        provider,
        ethToken.address,
        accountAddress
      );

      const swap1Result = await swapTokensFibrous(onchainWrite, {
        sellTokenSymbol: 'STRK',
        buyTokenSymbol: 'ETH',
        sellAmount: 10,
      });
      expect(swap1Result.status).toBe('success');
      if (swap1Result.status === 'failure') {
        throw new Error(swap1Result.error || 'Swap 1 failed');
      }

      await new Promise((resolve) => setTimeout(resolve, 10000));

      const swap2Result = await swapTokensFibrous(onchainWrite, {
        sellTokenSymbol: 'STRK',
        buyTokenSymbol: 'USDC',
        sellAmount: 10,
      });
      expect(swap2Result.status).toBe('success');
      if (swap2Result.status === 'failure') {
        throw new Error(swap2Result.error || 'Swap 2 failed');
      }

      await new Promise((resolve) => setTimeout(resolve, 10000));

      const receivedEth = await getAmountReceivedHumanUnits({
        provider,
        tokenAddress: ethToken.address,
        accountAddress,
        balanceBefore: ethBefore,
        decimals: Number(ethToken.decimals),
      });

      const receivedUsdc = await getAmountReceivedHumanUnits({
        provider,
        tokenAddress: usdcToken.address,
        accountAddress,
        balanceBefore: usdcBefore,
        decimals: Number(usdcToken.decimals),
      });

      const batchResult = await batchSwapTokens(onchainWrite, {
        sellTokenSymbols: ['ETH', 'USDC'],
        buyTokenSymbols: ['STRK', 'STRK'],
        sellAmounts: [Number(receivedEth), Number(receivedUsdc)],
        slippage: 5,
      });

      expect(batchResult.status).toBe('success');
      if (batchResult.status === 'failure') {
        throw new Error(batchResult.error || 'Batch swap failed');
      }

      const innerBatchResult = (batchResult as any).data;
      if (!innerBatchResult || innerBatchResult.status !== 'success') {
        throw new Error(innerBatchResult?.error || 'Batch swap failed');
      }

      const batchData = getDataAsRecord(innerBatchResult);
      expect(batchData.transactionHash).toBeDefined();
      expect(String(batchData.transactionHash)).toMatch(/^0x[0-9a-f]+$/i);
      expect(batchData.sellTokenSymbols).toHaveLength(2);
      expect(batchData.buyTokenSymbols).toHaveLength(2);
    }, 300000);
  });
});
