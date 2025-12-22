import { describe, beforeAll, it, expect, afterEach } from '@jest/globals';
import {
  getOnchainRead,
  getOnchainWrite,
  getDataAsRecord,
} from '@kasarlabs/ask-starknet-core';
import { depositMultiplyPosition } from '../../src/tools/write/deposit_multiply.js';
import { withdrawMultiplyPosition } from '../../src/tools/write/withdraw_multiply.js';
import { updateMultiplyPosition } from '../../src/tools/write/update_multiply.js';
import { getPools } from '../../src/tools/read/getPools.js';
import { getPositions } from '../../src/tools/read/getPositions.js';
import { getTokens } from '../../src/tools/read/getTokens.js';
import { GENESIS_POOLID } from '../../src/lib/constants/index.js';
import { normalizeAddress, expectLTVWithinTolerance } from '../helpers.js';

let accountAddress: string;

const STRK_ADDRESS =
  '0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d';

// Multiply test constants
const MULTIPLY_DEPOSIT_AMOUNT = '350'; // xSTRK amount
const MULTIPLY_TARGET_LTV = '65'; // 50% LTV
const MULTIPLY_UPDATE_LTV_LOW = '35'; // 25% LTV for update test
const MULTIPLY_UPDATE_LTV_HIGH = '80'; // 80% LTV for update test (with ±1% tolerance)

function getDataAsArray(
  data: Record<string, any> | Array<any> | undefined
): Array<any> {
  if (!data || !Array.isArray(data)) {
    throw new Error('Expected data to be an Array');
  }
  return data;
}

describe('Vesu Multiply E2E Tests', () => {
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
    it('should get pools and verify v2 pool for multiply operations', async () => {
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
        expect(pool.assets.length).toBeGreaterThan(1); // Need at least 2 assets for multiply
      }
    });

    it('should get tokens and verify STRK and other tokens', async () => {
      const onchainRead = getOnchainRead();
      const result = await getTokens(onchainRead, {});

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const tokens = getDataAsArray(result.data);
        expect(tokens.length).toBeGreaterThan(0);

        const strkToken = tokens.find(
          (token: any) => token.symbol.toUpperCase() === 'STRK'
        );
        expect(strkToken).toBeDefined();
      }
    });

    it('should get positions filtered by multiply type', async () => {
      const onchainRead = getOnchainRead();
      const result = await getPositions(onchainRead, {
        walletAddress: accountAddress as `0x${string}`,
        type: ['multiply'],
      });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const positions = getDataAsArray(result.data);
        // Positions might be empty, that's okay
        expect(Array.isArray(positions)).toBe(true);
        // All positions should be multiply type if any exist
        positions.forEach((pos: any) => {
          expect(pos.type).toBe('multiply');
        });
      }
    });

    it('should get positions with multiple type filters', async () => {
      const onchainRead = getOnchainRead();
      const result = await getPositions(onchainRead, {
        walletAddress: accountAddress as `0x${string}`,
        type: ['multiply', 'borrow', 'earn'],
      });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const positions = getDataAsArray(result.data);
        expect(Array.isArray(positions)).toBe(true);
      }
    });
  });

  describe('Multiply Operations', () => {
    it('should deposit STRK as collateral, borrow, and close position', async () => {
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

      // Use xSTRK as collateral and STRK as debt token
      const depositResult = await depositMultiplyPosition(onchainWrite, {
        collateralTokenSymbol: 'xSTRK',
        debtTokenSymbol: 'STRK',
        depositAmount: MULTIPLY_DEPOSIT_AMOUNT,
        targetLTV: MULTIPLY_TARGET_LTV,
        poolId: GENESIS_POOLID,
        ekuboSlippage: 500,
      });

      expect(depositResult.status).toBe('success');
      if (depositResult.status === 'success' && depositResult.data) {
        const data = getDataAsRecord(depositResult.data);
        expect(data.transaction_hash).toBeDefined();
        expect(data.transaction_hash).toMatch(/^0x[0-9a-f]+$/i);
        expect(data.collateralSymbol).toBe('xSTRK');
        expect(data.debtSymbol).toBe('STRK');
      }

      await new Promise((resolve) => setTimeout(resolve, 10000));

      // Verify position exists
      const positionsResult = await getPositions(onchainRead, {
        walletAddress: accountAddress as `0x${string}`,
        type: ['multiply'],
      });

      expect(positionsResult.status).toBe('success');
      if (positionsResult.status === 'success' && positionsResult.data) {
        const positions = getDataAsArray(positionsResult.data);
        const multiplyPosition = positions.find(
          (pos: any) =>
            pos.collateral?.symbol.toUpperCase() === 'XSTRK' &&
            pos.debt?.symbol.toUpperCase() === 'STRK' &&
            pos.type === 'multiply'
        );
        expect(multiplyPosition).toBeDefined();

        // Verify LTV is within ±1% tolerance
        if (multiplyPosition?.ltv?.current?.value) {
          const ltvValue = BigInt(multiplyPosition.ltv.current.value);
          const ltvDecimals = multiplyPosition.ltv.current.decimals || 18;
          const ltvPercentage = Number(ltvValue) / 10 ** ltvDecimals;
          expectLTVWithinTolerance(
            ltvPercentage,
            parseInt(MULTIPLY_TARGET_LTV)
          );
        }
      }

      // Close position (withdraw all)
      const withdrawResult = await withdrawMultiplyPosition(onchainWrite, {
        collateralTokenSymbol: 'xSTRK',
        debtTokenSymbol: 'STRK',
        ekuboSlippage: 500,
      });

      expect(withdrawResult.status).toBe('success');
      if (withdrawResult.status === 'success' && withdrawResult.data) {
        const data = getDataAsRecord(withdrawResult.data);
        expect(data.transaction_hash).toBeDefined();
        expect(data.transaction_hash).toMatch(/^0x[0-9a-f]+$/i);
        expect(data.collateralSymbol).toBe('xSTRK');
        expect(data.debtSymbol).toBe('STRK');
      }

      await new Promise((resolve) => setTimeout(resolve, 10000));
    }, 180000);

    it('should deposit STRK, update LTV, then close position', async () => {
      const onchainWrite = getOnchainWrite();

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

      // Deposit and create multiply position with xSTRK as collateral and STRK as debt
      const depositResult = await depositMultiplyPosition(onchainWrite, {
        collateralTokenSymbol: 'xSTRK',
        debtTokenSymbol: 'STRK',
        depositAmount: MULTIPLY_DEPOSIT_AMOUNT,
        targetLTV: MULTIPLY_TARGET_LTV,
        poolId: GENESIS_POOLID,
        ekuboSlippage: 500,
      });

      expect(depositResult.status).toBe('success');
      if (depositResult.status === 'success' && depositResult.data) {
        const data = getDataAsRecord(depositResult.data);
        expect(data.transaction_hash).toBeDefined();
      }

      await new Promise((resolve) => setTimeout(resolve, 10000));

      // Update LTV down to 25%
      const updateDownResult = await updateMultiplyPosition(onchainWrite, {
        collateralTokenSymbol: 'xSTRK',
        debtTokenSymbol: 'STRK',
        targetLTV: MULTIPLY_UPDATE_LTV_LOW,
        poolId: GENESIS_POOLID,
        ekuboSlippage: 500,
      });

      expect(updateDownResult.status).toBe('success');
      if (updateDownResult.status === 'success' && updateDownResult.data) {
        const data = getDataAsRecord(updateDownResult.data);
        expect(data.transaction_hash).toBeDefined();
        // Verify LTV is within ±1% tolerance (24% to 26%)
        const actualLTV = parseInt(data.targetLTV as string);
        expectLTVWithinTolerance(actualLTV, parseInt(MULTIPLY_UPDATE_LTV_LOW));
      }

      await new Promise((resolve) => setTimeout(resolve, 10000));

      // Update LTV back to 80% (with ±1% tolerance, so between 79% and 81%)
      const updateUpResult = await updateMultiplyPosition(onchainWrite, {
        collateralTokenSymbol: 'xSTRK',
        debtTokenSymbol: 'STRK',
        targetLTV: MULTIPLY_UPDATE_LTV_HIGH,
        poolId: GENESIS_POOLID,
        ekuboSlippage: 500,
      });

      expect(updateUpResult.status).toBe('success');
      if (updateUpResult.status === 'success' && updateUpResult.data) {
        const data = getDataAsRecord(updateUpResult.data);
        expect(data.transaction_hash).toBeDefined();
        // Verify LTV is within ±1% tolerance (79% to 81%)
        const actualLTV = parseInt(data.targetLTV as string);
        expectLTVWithinTolerance(actualLTV, parseInt(MULTIPLY_UPDATE_LTV_HIGH));
      }

      await new Promise((resolve) => setTimeout(resolve, 10000));

      // Close position
      const withdrawResult = await withdrawMultiplyPosition(onchainWrite, {
        collateralTokenSymbol: 'xSTRK',
        debtTokenSymbol: 'STRK',
        withdrawAmount: '0', // Close position
        poolId: GENESIS_POOLID,
        ekuboSlippage: 500,
      });

      expect(withdrawResult.status).toBe('success');
      if (withdrawResult.status === 'success' && withdrawResult.data) {
        const data = getDataAsRecord(withdrawResult.data);
        expect(data.transaction_hash).toBeDefined();
      }

      await new Promise((resolve) => setTimeout(resolve, 10000));
    }, 180000);

    it('should deposit STRK, withdraw partial, then close position', async () => {
      const onchainWrite = getOnchainWrite();
      const provider = onchainWrite.provider;
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

      // Deposit and create multiply position with xSTRK as collateral and STRK as debt
      const depositResult = await depositMultiplyPosition(onchainWrite, {
        collateralTokenSymbol: 'xSTRK',
        debtTokenSymbol: 'STRK',
        depositAmount: MULTIPLY_DEPOSIT_AMOUNT,
        targetLTV: MULTIPLY_TARGET_LTV,
        poolId: GENESIS_POOLID,
        ekuboSlippage: 500,
      });

      expect(depositResult.status).toBe('success');
      if (depositResult.status === 'success' && depositResult.data) {
        const data = getDataAsRecord(depositResult.data);
        expect(data.transaction_hash).toBeDefined();
      }

      await new Promise((resolve) => setTimeout(resolve, 10000));

      // Get position to see collateral amount
      const positionsResult = await getPositions(onchainRead, {
        walletAddress: accountAddress as `0x${string}`,
        type: ['multiply'],
      });

      let collateralAmount: string | undefined;
      if (
        positionsResult.status === 'success' &&
        positionsResult.data &&
        Array.isArray(positionsResult.data)
      ) {
        const positions = positionsResult.data;
        const multiplyPosition = positions.find(
          (pos: any) =>
            pos.collateral?.symbol.toUpperCase() === 'XSTRK' &&
            pos.debt?.symbol.toUpperCase() === 'STRK' &&
            pos.type === 'multiply'
        );

        if (multiplyPosition?.collateral?.value) {
          // Convert collateral value to human readable format
          const collateralValue = BigInt(multiplyPosition.collateral.value);
          const decimals = multiplyPosition.collateral.decimals || 18;
          const divisor = 10n ** BigInt(decimals);
          const wholePart = collateralValue / divisor;
          const fractionalPart = collateralValue % divisor;
          const fractionalStr = fractionalPart
            .toString()
            .padStart(decimals, '0')
            .replace(/0+$/, '');
          collateralAmount = fractionalStr
            ? `${wholePart}.${fractionalStr}`
            : wholePart.toString();
        }
      }

      if (collateralAmount) {
        // Withdraw partial (35% of collateral)
        const partialWithdrawAmount = (
          parseFloat(collateralAmount) * 0.35
        ).toFixed(6);

        const partialWithdrawResult = await withdrawMultiplyPosition(
          onchainWrite,
          {
            collateralTokenSymbol: 'xSTRK',
            debtTokenSymbol: 'STRK',
            withdrawAmount: partialWithdrawAmount,
            poolId: GENESIS_POOLID,
            ekuboSlippage: 500,
          }
        );

        expect(partialWithdrawResult.status).toBe('success');
        if (
          partialWithdrawResult.status === 'success' &&
          partialWithdrawResult.data
        ) {
          const data = getDataAsRecord(partialWithdrawResult.data);
          expect(data.transaction_hash).toBeDefined();
        }

        await new Promise((resolve) => setTimeout(resolve, 10000));
      }

      // Close remaining position
      const withdrawAllResult = await withdrawMultiplyPosition(onchainWrite, {
        collateralTokenSymbol: 'xSTRK',
        debtTokenSymbol: 'STRK',
        ekuboSlippage: 500,
      });

      expect(withdrawAllResult.status).toBe('success');
      if (withdrawAllResult.status === 'success' && withdrawAllResult.data) {
        const data = getDataAsRecord(withdrawAllResult.data);
        expect(data.transaction_hash).toBeDefined();
      }

      await new Promise((resolve) => setTimeout(resolve, 10000));
    }, 180000);

    it('should handle multiply with insufficient balance gracefully', async () => {
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

      const result = await depositMultiplyPosition(onchainWrite, {
        collateralTokenSymbol: 'xSTRK',
        debtTokenSymbol: 'STRK',
        depositAmount: '1000000000',
        targetLTV: MULTIPLY_TARGET_LTV,
        poolId: GENESIS_POOLID,
        ekuboSlippage: 500,
      });

      expect(result.status).toBe('failure');
      expect(result.error).toBeDefined();
    }, 120000);
  });

  afterEach(async () => {
    // Cleanup: close all remaining multiply positions
    try {
      const onchainWrite = getOnchainWrite();
      const onchainRead = getOnchainRead();
      const accountAddress = onchainWrite.account.address;

      const positionsResult = await getPositions(onchainRead, {
        walletAddress: accountAddress as `0x${string}`,
        type: ['multiply'],
      });

      if (
        positionsResult.status === 'success' &&
        positionsResult.data &&
        Array.isArray(positionsResult.data)
      ) {
        const positions = positionsResult.data;
        const xstrkMultiplyPositions = positions.filter(
          (pos: any) =>
            pos.collateral?.symbol.toUpperCase() === 'XSTRK' &&
            pos.debt?.symbol.toUpperCase() === 'STRK' &&
            pos.type === 'multiply'
        );

        for (const position of xstrkMultiplyPositions) {
          try {
            // Check if position has debt to close
            const debtAmount = position.nominalDebt?.value
              ? BigInt(position.nominalDebt.value)
              : position.debt?.value
                ? BigInt(position.debt.value)
                : 0n;

            let withdrawParams: any = {
              collateralTokenSymbol: 'xSTRK',
              debtTokenSymbol: 'STRK',
              poolId: GENESIS_POOLID,
              ekuboSlippage: 500,
            };

            if (debtAmount === 0n) {
              // No debt to close, withdraw the net position amount (collateral amount)
              if (position.collateral?.value) {
                const collateralValue = BigInt(position.collateral.value);
                const decimals = position.collateral.decimals || 18;
                const divisor = 10n ** BigInt(decimals);
                const wholePart = collateralValue / divisor;
                const fractionalPart = collateralValue % divisor;
                const fractionalStr = fractionalPart
                  .toString()
                  .padStart(decimals, '0')
                  .replace(/0+$/, '');
                const collateralAmount = fractionalStr
                  ? `${wholePart}.${fractionalStr}`
                  : wholePart.toString();
                withdrawParams.withdrawAmount = collateralAmount;
              } else {
                // Fallback: try to close anyway if collateral value is not available
                withdrawParams.withdrawAmount = '0';
              }
            } else {
              // Has debt, close position
              withdrawParams.withdrawAmount = '0';
            }

            await withdrawMultiplyPosition(onchainWrite, withdrawParams);
            await new Promise((resolve) => setTimeout(resolve, 10000));
          } catch (error) {
            // Ignore errors during cleanup
            console.warn('Cleanup withdraw multiply error:', error);
          }
        }
      }
    } catch (error) {
      // Ignore cleanup errors
      console.warn('Cleanup error:', error);
    }

    await new Promise((resolve) => setTimeout(resolve, 30000));
  });
});
