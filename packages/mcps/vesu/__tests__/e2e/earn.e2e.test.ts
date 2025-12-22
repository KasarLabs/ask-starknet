import { describe, beforeAll, it, expect, afterEach } from '@jest/globals';
import {
  getOnchainRead,
  getOnchainWrite,
  getDataAsRecord,
  getERC20Balance,
} from '@kasarlabs/ask-starknet-core';
import { depositEarnPosition } from '../../src/tools/write/deposit_earn.js';
import { withdrawEarnPosition } from '../../src/tools/write/withdraw_earn.js';
import { getPools } from '../../src/tools/read/getPools.js';
import { getPositions } from '../../src/tools/read/getPositions.js';
import { getTokens } from '../../src/tools/read/getTokens.js';
import { GENESIS_POOLID } from '../../src/lib/constants/index.js';
import { normalizeAddress } from '../helpers.js';

let accountAddress: string;

const STRK_ADDRESS =
  '0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d';

function getDataAsArray(
  data: Record<string, any> | Array<any> | undefined
): Array<any> {
  if (!data || !Array.isArray(data)) {
    throw new Error('Expected data to be an Array');
  }
  return data;
}

describe('Vesu Deposit/Withdraw/Earn E2E Tests', () => {
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
    it('should get pools using default pool (v2)', async () => {
      const onchainRead = getOnchainRead();
      const result = await getPools(onchainRead, {
        onlyVerified: true,
        onlyEnabledAssets: true,
      });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const pools = getDataAsArray(result.data);
        expect(pools.length).toBeGreaterThan(0);

        // Find the default pool (v2)
        const defaultPool = pools.find(
          (pool: any) => pool.id === GENESIS_POOLID
        );
        expect(defaultPool).toBeDefined();
        expect(defaultPool.protocolVersion).toBe('v2');
      }
    });

    it('should get pools by poolId (default pool)', async () => {
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
        expect(pool.id).toBe(GENESIS_POOLID);
        expect(pool.protocolVersion).toBe('v2');
        expect(pool.assets).toBeDefined();
        expect(Array.isArray(pool.assets)).toBe(true);
      }
    });

    it('should get tokens and find STRK', async () => {
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
        expect(strkToken.address).toBeDefined();
        expect(strkToken.decimals).toBeDefined();
      }
    });

    it('should get tokens by address (STRK)', async () => {
      const onchainRead = getOnchainRead();
      const result = await getTokens(onchainRead, {
        address: STRK_ADDRESS,
      });

      expect(result.status).toBe('success');

      if (result.status === 'success' && result.data) {
        const tokens = getDataAsArray(result.data);
        expect(tokens.length).toBeGreaterThan(0);
        const normalizedStrkAddress = normalizeAddress(STRK_ADDRESS);
        const strkToken = tokens.find(
          (token: any) =>
            normalizeAddress(token.address) === normalizedStrkAddress
        );
        expect(strkToken).toBeDefined();
        expect(strkToken.symbol).toBe('STRK');
      }
    });

    it('should get all tokens', async () => {
      const onchainRead = getOnchainRead();
      const result = await getTokens(onchainRead, {});

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const tokens = getDataAsArray(result.data);
        expect(tokens.length).toBeGreaterThan(0);
      }
    });

    it('should get positions for account (earn type)', async () => {
      const onchainRead = getOnchainRead();
      const result = await getPositions(onchainRead, {
        walletAddress: accountAddress as `0x${string}`,
        type: ['earn'],
      });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const positions = getDataAsArray(result.data);
        // Positions might be empty, that's okay
        expect(Array.isArray(positions)).toBe(true);
      }
    });
  });

  describe('Deposit/Withdraw Earn Operations', () => {
    it('should deposit STRK to earn and then withdraw all', async () => {
      const onchainWrite = getOnchainWrite();
      const provider = onchainWrite.provider;
      const accountAddress = onchainWrite.account.address;

      const balanceBefore = await getERC20Balance(
        provider,
        STRK_ADDRESS,
        accountAddress
      );

      // Deposit a small amount (1 STRK)
      const depositAmount = '1';
      const depositResult = await depositEarnPosition(onchainWrite, {
        depositTokenSymbol: 'STRK',
        depositAmount,
        poolId: GENESIS_POOLID,
      });

      expect(depositResult.status).toBe('success');
      if (depositResult.status === 'success' && depositResult.data) {
        const data = getDataAsRecord(depositResult.data);
        expect(data.transaction_hash).toBeDefined();
        expect(data.transaction_hash).toMatch(/^0x[0-9a-f]+$/i);
        expect(data.symbol).toBe('STRK');
        expect(data.amount).toBe(depositAmount);
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Verify position exists
      const onchainRead = getOnchainRead();
      const positionsResult = await getPositions(onchainRead, {
        walletAddress: accountAddress as `0x${string}`,
        type: ['earn'],
      });

      expect(positionsResult.status).toBe('success');
      if (positionsResult.status === 'success' && positionsResult.data) {
        const positions = getDataAsArray(positionsResult.data);
        const strkEarnPosition = positions.find(
          (pos: any) =>
            pos.collateral?.symbol.toUpperCase() === 'STRK' &&
            pos.type === 'earn'
        );
        expect(strkEarnPosition).toBeDefined();
      }

      // Withdraw all
      const withdrawResult = await withdrawEarnPosition(onchainWrite, {
        withdrawTokenSymbol: 'STRK',
        withdrawAmount: '0', // Withdraw all
        poolId: GENESIS_POOLID,
      });

      expect(withdrawResult.status).toBe('success');
      if (withdrawResult.status === 'success' && withdrawResult.data) {
        const data = getDataAsRecord(withdrawResult.data);
        expect(data.transaction_hash).toBeDefined();
        expect(data.transaction_hash).toMatch(/^0x[0-9a-f]+$/i);
        expect(data.symbol).toBe('STRK');
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));
    }, 180000);

    it('should deposit STRK with specific amount and withdraw specific amount', async () => {
      const onchainWrite = getOnchainWrite();

      // Deposit 1 STRK
      const depositAmount = '1';
      const depositResult = await depositEarnPosition(onchainWrite, {
        depositTokenSymbol: 'STRK',
        depositAmount,
        poolId: GENESIS_POOLID,
      });

      expect(depositResult.status).toBe('success');
      if (depositResult.status === 'success' && depositResult.data) {
        const data = getDataAsRecord(depositResult.data);
        expect(data.transaction_hash).toBeDefined();
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Withdraw a portion (0.3 STRK)
      const withdrawAmount = '0.3';
      const withdrawResult = await withdrawEarnPosition(onchainWrite, {
        withdrawTokenSymbol: 'STRK',
        withdrawAmount,
        poolId: GENESIS_POOLID,
      });

      expect(withdrawResult.status).toBe('success');
      if (withdrawResult.status === 'success' && withdrawResult.data) {
        const data = getDataAsRecord(withdrawResult.data);
        expect(data.transaction_hash).toBeDefined();
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Withdraw remaining (all)
      const withdrawAllResult = await withdrawEarnPosition(onchainWrite, {
        withdrawTokenSymbol: 'STRK',
        withdrawAmount: '0', // Withdraw all remaining
        poolId: GENESIS_POOLID,
      });

      expect(withdrawAllResult.status).toBe('success');
      if (withdrawAllResult.status === 'success' && withdrawAllResult.data) {
        const data = getDataAsRecord(withdrawAllResult.data);
        expect(data.transaction_hash).toBeDefined();
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));
    }, 180000);

    it('should handle deposit with insufficient balance gracefully', async () => {
      const onchainWrite = getOnchainWrite();

      const result = await depositEarnPosition(onchainWrite, {
        depositTokenSymbol: 'STRK',
        depositAmount: '1000000000',
        poolId: GENESIS_POOLID,
      });

      expect(result.status).toBe('failure');
      expect(result.error).toBeDefined();
    }, 120000);
  });

  afterEach(async () => {
    // Cleanup: withdraw all remaining positions
    try {
      const onchainWrite = getOnchainWrite();
      const onchainRead = getOnchainRead();
      const accountAddress = onchainWrite.account.address;

      const positionsResult = await getPositions(onchainRead, {
        walletAddress: accountAddress as `0x${string}`,
        type: ['earn'],
      });

      if (
        positionsResult.status === 'success' &&
        positionsResult.data &&
        Array.isArray(positionsResult.data)
      ) {
        try {
          await withdrawEarnPosition(onchainWrite, {
            withdrawTokenSymbol: 'STRK',
            withdrawAmount: '0', // Withdraw all
          });
          await new Promise((resolve) => setTimeout(resolve, 3000));
        } catch (error) {
          // Ignore errors during cleanup
          console.error('Cleanup withdraw error:', error);
        }
      }
    } catch (error) {
      // Ignore cleanup errors
      console.error('Cleanup error:', error);
    }

    await new Promise((resolve) => setTimeout(resolve, 5000));
  });
});
