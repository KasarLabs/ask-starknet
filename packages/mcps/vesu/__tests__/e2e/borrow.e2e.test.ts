import { describe, beforeAll, it, expect, afterEach } from '@jest/globals';
import {
  getOnchainRead,
  getOnchainWrite,
  getDataAsRecord,
  getERC20Balance,
} from '@kasarlabs/ask-starknet-core';
import { depositBorrowPosition } from '../../src/tools/write/deposit_borrow.js';
import { repayBorrowPosition } from '../../src/tools/write/repay_borrow.js';
import { getPools } from '../../src/tools/read/getPools.js';
import { getPositions } from '../../src/tools/read/getPositions.js';
import { getTokens } from '../../src/tools/read/getTokens.js';
import { GENESIS_POOLID } from '../../src/lib/constants/index.js';
import { normalizeAddress, expectLTVWithinTolerance } from '../helpers.js';

let accountAddress: string;

const STRK_ADDRESS =
  '0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d';

// Borrow test constants
const BORROW_DEPOSIT_AMOUNT = '400';
const BORROW_TARGET_LTV = '66';

function getDataAsArray(
  data: Record<string, any> | Array<any> | undefined
): Array<any> {
  if (!data || !Array.isArray(data)) {
    throw new Error('Expected data to be an Array');
  }
  return data;
}

describe('Vesu Borrow E2E Tests', () => {
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

  describe('Read Operations', () => {
    it('should get pools and verify v2 pool structure', async () => {
      const onchainRead = getOnchainRead();
      const result = await getPools(onchainRead, {
        poolId: GENESIS_POOLID,
        onlyVerified: true,
        onlyEnabledAssets: true,
      });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const pools = getDataAsArray(result.data);
        expect(pools.length).toBe(1);
        const pool = pools[0];
        expect(pool.protocolVersion).toBe('v2');
        expect(pool.assets).toBeDefined();
        expect(Array.isArray(pool.assets)).toBe(true);

        // Verify STRK is in the pool
        const strkAsset = pool.assets.find(
          (asset: any) => asset.symbol.toUpperCase() === 'STRK'
        );
        expect(strkAsset).toBeDefined();
      }
    });

    it('should get tokens and verify STRK token details', async () => {
      const onchainRead = getOnchainRead();
      const result = await getTokens(onchainRead, {
        symbol: 'STRK',
      });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const tokens = getDataAsArray(result.data);
        expect(tokens.length).toBeGreaterThan(0);
        const strkToken = tokens.find(
          (token: any) => token.symbol.toUpperCase() === 'STRK'
        );
        expect(strkToken).toBeDefined();
        expect(normalizeAddress(strkToken.address)).toBe(
          normalizeAddress(STRK_ADDRESS)
        );
        expect(strkToken.decimals).toBe(18);
      }
    });

    it('should get positions filtered by borrow type', async () => {
      const onchainRead = getOnchainRead();
      const result = await getPositions(onchainRead, {
        walletAddress: accountAddress as `0x${string}`,
        type: ['borrow'],
      });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const positions = getDataAsArray(result.data);
        // Positions might be empty, that's okay
        expect(Array.isArray(positions)).toBe(true);
        // All positions should be borrow type if any exist
        positions.forEach((pos: any) => {
          expect(pos.type).toBe('borrow');
        });
      }
    });

    it('should get all positions without type filter', async () => {
      const onchainRead = getOnchainRead();
      const result = await getPositions(onchainRead, {
        walletAddress: accountAddress as `0x${string}`,
      });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const positions = getDataAsArray(result.data);
        expect(Array.isArray(positions)).toBe(true);
      }
    });
  });

  describe('Borrow Operations', () => {
    it('should deposit STRK as collateral and borrow, then repay all', async () => {
      const onchainWrite = getOnchainWrite();
      const provider = onchainWrite.provider;
      const accountAddress = onchainWrite.account.address;

      // First, get available tokens in the pool to find a debt token
      const onchainRead = getOnchainRead();
      const poolsResult = await getPools(onchainRead, {
        poolId: GENESIS_POOLID,
        onlyVerified: true,
        onlyEnabledAssets: true,
      });

      expect(poolsResult.status).toBe('success');
      if (poolsResult.status !== 'success' || !poolsResult.data) {
        throw new Error('Failed to get pool information');
      }

      const pools = getDataAsArray(poolsResult.data);
      const pool = pools[0];
      const strkAsset = pool.assets.find(
        (asset: any) => asset.symbol.toUpperCase() === 'STRK'
      );

      if (!strkAsset) {
        throw new Error('STRK not found in pool');
      }

      // Find a different token to borrow (not STRK)
      const debtAsset = pool.assets.find(
        (asset: any) => asset.symbol.toUpperCase() == 'USDC'
      );

      if (!debtAsset) {
        throw new Error('No debt asset found in pool');
      }

      const depositResult = await depositBorrowPosition(onchainWrite, {
        collateralTokenSymbol: 'STRK',
        debtTokenSymbol: debtAsset.symbol,
        depositAmount: BORROW_DEPOSIT_AMOUNT,
        targetLTV: BORROW_TARGET_LTV,
      });

      expect(depositResult.status).toBe('success');
      if (depositResult.status === 'success' && depositResult.data) {
        const data = getDataAsRecord(depositResult.data);
        expect(data.transaction_hash).toBeDefined();
        expect(data.transaction_hash).toMatch(/^0x[0-9a-f]+$/i);
        expect(data.collateralSymbol).toBe('STRK');
        expect(data.debtSymbol).toBe(debtAsset.symbol);
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Verify position exists
      const positionsResult = await getPositions(onchainRead, {
        walletAddress: accountAddress as `0x${string}`,
        type: ['borrow'],
      });

      expect(positionsResult.status).toBe('success');
      if (positionsResult.status === 'success' && positionsResult.data) {
        const positions = getDataAsArray(positionsResult.data);
        const borrowPosition = positions.find(
          (pos: any) =>
            pos.collateral?.symbol.toUpperCase() === 'STRK' &&
            pos.debt?.symbol.toUpperCase() === debtAsset.symbol.toUpperCase() &&
            pos.type === 'borrow'
        );
        expect(borrowPosition).toBeDefined();

        // Verify LTV is within ±1% tolerance
        if (borrowPosition?.ltv?.current?.value) {
          // LTV from API is in format with decimals (e.g., 610000000000000000 = 61%)
          // Convert to percentage: divide by 10^16
          const ltvValue = BigInt(borrowPosition.ltv.current.value);
          const ltvDecimals = borrowPosition.ltv.current.decimals || 18;
          const ltvPercentage = Number(ltvValue) / 10 ** ltvDecimals;
          expectLTVWithinTolerance(ltvPercentage, parseInt(BORROW_TARGET_LTV));
        }
      }

      // Repay all debt
      const repayResult = await repayBorrowPosition(onchainWrite, {
        collateralTokenSymbol: 'STRK',
        debtTokenSymbol: debtAsset.symbol,
        poolId: GENESIS_POOLID,
      });

      expect(repayResult.status).toBe('success');
      if (repayResult.status === 'success' && repayResult.data) {
        const data = getDataAsRecord(repayResult.data);
        expect(data.transaction_hash).toBeDefined();
        expect(data.transaction_hash).toMatch(/^0x[0-9a-f]+$/i);
        expect(data.collateralSymbol).toBe('STRK');
        expect(data.debtSymbol).toBe(debtAsset.symbol);
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));
    }, 180000);

    it('should deposit STRK, borrow, repay partial, then repay remaining', async () => {
      const onchainWrite = getOnchainWrite();
      const accountAddress = onchainWrite.account.address;

      // Get pool to find debt token
      const onchainRead = getOnchainRead();
      const poolsResult = await getPools(onchainRead, {
        poolId: GENESIS_POOLID,
        onlyVerified: true,
        onlyEnabledAssets: true,
      });

      expect(poolsResult.status).toBe('success');
      if (poolsResult.status !== 'success' || !poolsResult.data) {
        throw new Error('Failed to get pool information');
      }

      const pools = getDataAsArray(poolsResult.data);
      const pool = pools[0];
      const debtAsset = pool.assets.find(
        (asset: any) => asset.symbol.toUpperCase() == 'USDC'
      );

      if (!debtAsset) {
        throw new Error('No debt asset found in pool');
      }

      // Deposit and borrow
      const depositResult = await depositBorrowPosition(onchainWrite, {
        collateralTokenSymbol: 'STRK',
        debtTokenSymbol: debtAsset.symbol,
        depositAmount: BORROW_DEPOSIT_AMOUNT,
        targetLTV: BORROW_TARGET_LTV,
        poolId: GENESIS_POOLID,
      });

      expect(depositResult.status).toBe('success');
      if (depositResult.status === 'success' && depositResult.data) {
        const data = getDataAsRecord(depositResult.data);
        expect(data.transaction_hash).toBeDefined();
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Get position to see debt amount
      const positionsResult = await getPositions(onchainRead, {
        walletAddress: accountAddress as `0x${string}`,
        type: ['borrow'],
      });

      let totalDebt: string | undefined;
      if (
        positionsResult.status === 'success' &&
        positionsResult.data &&
        Array.isArray(positionsResult.data)
      ) {
        const positions = positionsResult.data;
        const borrowPosition = positions.find(
          (pos: any) =>
            pos.collateral?.symbol.toUpperCase() === 'STRK' &&
            pos.debt?.symbol.toUpperCase() === debtAsset.symbol.toUpperCase() &&
            pos.type === 'borrow'
        );

        // Verify LTV is within ±1% tolerance
        if (borrowPosition?.ltv?.current?.value) {
          const ltvValue = BigInt(borrowPosition.ltv.current.value);
          const ltvDecimals = borrowPosition.ltv.current.decimals || 18;
          const ltvPercentage = Number(ltvValue) / 10 ** ltvDecimals;
          expectLTVWithinTolerance(ltvPercentage, parseInt(BORROW_TARGET_LTV));
        }

        if (borrowPosition?.debt?.value) {
          // Convert debt value to human readable format
          const debtValue = BigInt(borrowPosition.debt.value);
          const decimals = borrowPosition.debt.decimals || 18;
          const divisor = 10n ** BigInt(decimals);
          const wholePart = debtValue / divisor;
          const fractionalPart = debtValue % divisor;
          const fractionalStr = fractionalPart
            .toString()
            .padStart(decimals, '0')
            .replace(/0+$/, '');
          totalDebt = fractionalStr
            ? `${wholePart}.${fractionalStr}`
            : wholePart.toString();
        }
      }

      if (totalDebt) {
        // Repay partial (50% of debt)
        const partialRepayAmount = (parseFloat(totalDebt) * 0.5).toFixed(6);

        const partialRepayResult = await repayBorrowPosition(onchainWrite, {
          collateralTokenSymbol: 'STRK',
          debtTokenSymbol: debtAsset.symbol,
          repayAmount: partialRepayAmount,
          poolId: GENESIS_POOLID,
        });

        expect(partialRepayResult.status).toBe('success');
        if (
          partialRepayResult.status === 'success' &&
          partialRepayResult.data
        ) {
          const data = getDataAsRecord(partialRepayResult.data);
          expect(data.transaction_hash).toBeDefined();
        }

        await new Promise((resolve) => setTimeout(resolve, 5000));
      }

      // Repay remaining (all)
      const repayAllResult = await repayBorrowPosition(onchainWrite, {
        collateralTokenSymbol: 'STRK',
        debtTokenSymbol: debtAsset.symbol,
        // repayAmount not provided = repay all
        poolId: GENESIS_POOLID,
      });

      expect(repayAllResult.status).toBe('success');
      if (repayAllResult.status === 'success' && repayAllResult.data) {
        const data = getDataAsRecord(repayAllResult.data);
        expect(data.transaction_hash).toBeDefined();
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));
    }, 180000);

    it('should handle borrow with insufficient balance gracefully', async () => {
      const onchainWrite = getOnchainWrite();
      const onchainRead = getOnchainRead();

      // Get pool to find debt token
      const poolsResult = await getPools(onchainRead, {
        poolId: GENESIS_POOLID,
        onlyVerified: true,
        onlyEnabledAssets: true,
      });

      if (poolsResult.status !== 'success' || !poolsResult.data) {
        throw new Error('Failed to get pool information');
      }

      const pools = getDataAsArray(poolsResult.data);
      const pool = pools[0];
      const debtAsset = pool.assets.find(
        (asset: any) => asset.symbol.toUpperCase() == 'USDC'
      );

      if (!debtAsset) {
        throw new Error('No debt asset found in pool');
      }

      const result = await depositBorrowPosition(onchainWrite, {
        collateralTokenSymbol: 'STRK',
        debtTokenSymbol: debtAsset.symbol,
        depositAmount: '1000000000',
        targetLTV: '75',
        poolId: GENESIS_POOLID,
      });

      expect(result.status).toBe('failure');
      expect(result.error).toBeDefined();
    }, 120000);
  });

  afterEach(async () => {
    // Cleanup: repay all remaining borrow positions
    try {
      const onchainWrite = getOnchainWrite();
      const onchainRead = getOnchainRead();
      const accountAddress = onchainWrite.account.address;

      const positionsResult = await getPositions(onchainRead, {
        walletAddress: accountAddress as `0x${string}`,
        type: ['borrow'],
      });

      if (
        positionsResult.status === 'success' &&
        positionsResult.data &&
        Array.isArray(positionsResult.data)
      ) {
        const positions = positionsResult.data;
        const strkBorrowPositions = positions.filter(
          (pos: any) =>
            pos.collateral?.symbol.toUpperCase() === 'STRK' &&
            pos.type === 'borrow'
        );

        for (const position of strkBorrowPositions) {
          try {
            await repayBorrowPosition(onchainWrite, {
              collateralTokenSymbol: 'STRK',
              debtTokenSymbol: position.debt?.symbol || '',
              // repayAmount not provided = repay all
              poolId: GENESIS_POOLID,
            });
            await new Promise((resolve) => setTimeout(resolve, 3000));
          } catch (error) {
            // Ignore errors during cleanup
            console.warn('Cleanup repay error:', error);
          }
        }
      }
    } catch (error) {
      // Ignore cleanup errors
      console.warn('Cleanup error:', error);
    }

    await new Promise((resolve) => setTimeout(resolve, 5000));
  });
});
