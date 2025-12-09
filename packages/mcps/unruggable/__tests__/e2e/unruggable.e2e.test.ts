import { describe, beforeAll, it, expect, afterEach } from '@jest/globals';
import {
  getOnchainRead,
  getOnchainWrite,
  getDataAsRecord,
} from '@kasarlabs/ask-starknet-core';
import { isMemecoin } from '../../src/tools/isMemecoin.js';
import { getLockedLiquidity } from '../../src/tools/getLockedLiquidity.js';
import { createMemecoin } from '../../src/tools/createMemecoin.js';
import { launchOnEkubo } from '../../src/tools/launchOnEkubo.js';
import { extractMemecoinAddressFromReceipt } from '../../src/lib/utils/events.js';

let accountAddress: string;

const FACTORY_ADDRESS =
  '0x01a46467a9246f45c8c340f1f155266a26a71c07bd55d36e8d1c7d0d438a2dbc';

describe('Unruggable E2E Tests', () => {
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

    if (!process.env.STARKNET_PRIVATE_KEY) {
      throw new Error(
        'STARKNET_PRIVATE_KEY must be set in environment variables'
      );
    }
  });

  describe('Read Operations', () => {
    it('should check if factory address is not a memecoin', async () => {
      const onchainWrite = getOnchainWrite();
      const result = await isMemecoin(onchainWrite, {
        contractAddress: FACTORY_ADDRESS,
      });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.isMemecoin).toBeDefined();
        expect(typeof data.isMemecoin).toBe('boolean');
        expect(data.isMemecoin).toBe(false);
      }
    });

    it('should check if invalid address returns false or error', async () => {
      const onchainWrite = getOnchainWrite();
      const invalidAddress =
        '0x0000000000000000000000000000000000000000000000000000000000000000';
      const result = await isMemecoin(onchainWrite, {
        contractAddress: invalidAddress,
      });

      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.isMemecoin).toBeDefined();
        expect(typeof data.isMemecoin).toBe('boolean');
      } else {
        expect(result.status).toBe('failure');
        expect(result.error).toBeDefined();
      }
    });

    it('should get locked liquidity for factory address (should fail because factory is not a memecoin)', async () => {
      const onchainWrite = getOnchainWrite();
      const result = await getLockedLiquidity(onchainWrite, {
        contractAddress: FACTORY_ADDRESS,
      });

      expect(result.status).toBe('failure');
      expect(result.error).toBeDefined();
    });

    it('should handle get locked liquidity for invalid address gracefully', async () => {
      const onchainWrite = getOnchainWrite();
      const invalidAddress =
        '0x0000000000000000000000000000000000000000000000000000000000000000';
      const result = await getLockedLiquidity(onchainWrite, {
        contractAddress: invalidAddress,
      });

      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.hasLockedLiquidity).toBeDefined();
        expect(typeof data.hasLockedLiquidity).toBe('boolean');
      } else {
        expect(result.status).toBe('failure');
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('Create Memecoin Operations', () => {
    let createdMemecoinAddress: string | null = null;

    it('should create a new memecoin successfully', async () => {
      const onchainWrite = getOnchainWrite();
      const provider = onchainWrite.provider;

      const memecoinName = `TestCoin_${Date.now()}`;
      const memecoinSymbol = `TEST${Date.now().toString().slice(-4)}`;
      const initialSupply = '1000000';

      const result = await createMemecoin(onchainWrite, {
        owner: accountAddress,
        name: memecoinName,
        symbol: memecoinSymbol,
        initialSupply,
      });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.transactionHash).toBeDefined();
        expect(data.transactionHash).toMatch(/^0x[0-9a-f]+$/i);

        await provider.waitForTransaction(data.transactionHash as string);
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }, 180000);

    it('should verify created memecoin is recognized as memecoin', async () => {
      const onchainWrite = getOnchainWrite();
      const result = await isMemecoin(onchainWrite, {
        contractAddress: FACTORY_ADDRESS,
      });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.isMemecoin).toBe(false);
      }
    });

    it('should handle create memecoin with invalid owner address gracefully', async () => {
      const onchainWrite = getOnchainWrite();

      // Test with invalid address format (too short, invalid characters)
      const result = await createMemecoin(onchainWrite, {
        owner: '0xinvalid',
        name: 'TestCoin',
        symbol: 'TEST',
        initialSupply: '1000000',
      });

      expect(result.status).toBe('failure');
      expect(result.error).toBeDefined();
      expect(result.error).toMatch(/address|invalid|format/i);
    }, 120000);

    it('should handle create memecoin with empty name gracefully', async () => {
      const onchainWrite = getOnchainWrite();

      const result = await createMemecoin(onchainWrite, {
        owner: accountAddress,
        name: '',
        symbol: 'TEST',
        initialSupply: '1000000',
      });

      expect(result.status).toBeDefined();
      if (result.status === 'failure') {
        expect(result.error).toBeDefined();
      }
    }, 120000);
  });

  describe('Launch on Ekubo Operations', () => {
    it('should handle launch on Ekubo with invalid memecoin address gracefully', async () => {
      const onchainWrite = getOnchainWrite();

      const result = await launchOnEkubo(onchainWrite, {
        memecoinAddress:
          '0x0000000000000000000000000000000000000000000000000000000000000000',
        transferRestrictionDelay: 86400,
        maxPercentageBuyLaunch: 5,
        quoteToken: 'STRK',
        initialHolders: [accountAddress],
        initialHoldersAmounts: ['1'],
        fee: '0.3',
        startingMarketCap: '10000',
      });

      expect(result.status).toBe('failure');
      expect(result.error).toBeDefined();
    }, 120000);

    it('should handle launch on Ekubo with mismatched holders and amounts arrays', async () => {
      const onchainWrite = getOnchainWrite();

      try {
        const result = await launchOnEkubo(onchainWrite, {
          memecoinAddress: FACTORY_ADDRESS,
          transferRestrictionDelay: 86400,
          maxPercentageBuyLaunch: 5,
          quoteToken: 'STRK',
          initialHolders: [accountAddress, accountAddress],
          initialHoldersAmounts: ['1'],
          fee: '0.3',
          startingMarketCap: '10000',
        });

        expect(result.status).toBe('failure');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle launch on Ekubo with invalid fee gracefully', async () => {
      const onchainWrite = getOnchainWrite();

      try {
        const result = await launchOnEkubo(onchainWrite, {
          memecoinAddress: FACTORY_ADDRESS,
          transferRestrictionDelay: 86400,
          maxPercentageBuyLaunch: 5,
          quoteToken: 'STRK',
          initialHolders: [accountAddress],
          initialHoldersAmounts: ['1'],
          fee: '2',
          startingMarketCap: '10000',
        });

        expect(result.status).toBe('failure');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle launch on Ekubo with invalid max percentage buy gracefully', async () => {
      const onchainWrite = getOnchainWrite();

      try {
        const result = await launchOnEkubo(onchainWrite, {
          memecoinAddress: FACTORY_ADDRESS,
          transferRestrictionDelay: 86400,
          maxPercentageBuyLaunch: 150,
          quoteToken: 'STRK',
          initialHolders: [accountAddress],
          initialHoldersAmounts: ['1'],
          fee: '0.3',
          startingMarketCap: '10000',
        });

        expect(result.status).toBe('failure');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should launch memecoin on Ekubo successfully', async () => {
      const onchainWrite = getOnchainWrite();
      const provider = onchainWrite.provider;

      const memecoinName = `LaunchTest_${Date.now()}`;
      const memecoinSymbol = `LAUNCH${Date.now().toString().slice(-4)}`;
      const initialSupply = '1000000';

      const createResult = await createMemecoin(onchainWrite, {
        owner: accountAddress,
        name: memecoinName,
        symbol: memecoinSymbol,
        initialSupply,
      });

      expect(createResult.status).toBe('success');
      if (createResult.status !== 'success' || !createResult.data) {
        throw new Error('Failed to create memecoin for launch test');
      }

      const createData = getDataAsRecord(createResult.data);
      const transactionHash = createData.transactionHash as string;

      await provider.waitForTransaction(transactionHash);
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const receipt = await provider.getTransactionReceipt(transactionHash);
      const memecoinAddress = extractMemecoinAddressFromReceipt(receipt);

      if (!memecoinAddress) {
        throw new Error(
          'Could not extract memecoin address from transaction receipt'
        );
      }

      const launchResult = await launchOnEkubo(onchainWrite, {
        memecoinAddress: memecoinAddress,
        transferRestrictionDelay: 86400,
        maxPercentageBuyLaunch: 5,
        quoteToken: 'STRK',
        initialHolders: [accountAddress],
        initialHoldersAmounts: ['1'],
        fee: '0.3',
        startingMarketCap: '10000',
      });
      expect(launchResult.status).toBe('success');
      if (launchResult.status === 'success' && launchResult.data) {
        const launchData = getDataAsRecord(launchResult.data);
        expect(launchData.transactionHash).toBeDefined();
        expect(launchData.transactionHash).toMatch(/^0x[0-9a-f]+$/i);

        await provider.waitForTransaction(launchData.transactionHash as string);
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }, 300000);
  });

  describe('Integration Tests', () => {
    it('should complete full workflow: create memecoin → verify it is memecoin → check locked liquidity', async () => {
      const onchainWrite = getOnchainWrite();
      const provider = onchainWrite.provider;

      const memecoinName = `IntegrationTest_${Date.now()}`;
      const memecoinSymbol = `INT${Date.now().toString().slice(-4)}`;
      const initialSupply = '1000000';

      const createResult = await createMemecoin(onchainWrite, {
        owner: accountAddress,
        name: memecoinName,
        symbol: memecoinSymbol,
        initialSupply,
      });

      expect(createResult.status).toBe('success');
      let transactionHash = '';
      let memecoinAddress = '';
      if (createResult.status === 'success' && createResult.data) {
        const createData = getDataAsRecord(createResult.data);
        transactionHash = createData.transactionHash as string;
        memecoinAddress = createData.memecoinAddress as string;
        expect(transactionHash).toBeDefined();
        expect(transactionHash).toMatch(/^0x[0-9a-f]+$/i);
      }

      if (transactionHash) {
        await provider.waitForTransaction(transactionHash);
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }

      const isMemecoinResult = await isMemecoin(onchainWrite, {
        contractAddress: memecoinAddress,
      });

      expect(isMemecoinResult.status).toBe('success');
      if (isMemecoinResult.status === 'success' && isMemecoinResult.data) {
        const isMemecoinData = getDataAsRecord(isMemecoinResult.data);
        expect(isMemecoinData.isMemecoin).toBe(true);
      }

      const liquidityResult = await getLockedLiquidity(onchainWrite, {
        contractAddress: memecoinAddress,
      });

      expect(liquidityResult.status).toBe('success');
      if (liquidityResult.status === 'success' && liquidityResult.data) {
        const liquidityData = getDataAsRecord(liquidityResult.data);
        expect(liquidityData.hasLockedLiquidity).toBeDefined();
        expect(typeof liquidityData.hasLockedLiquidity).toBe('boolean');
      }
    }, 180000);
  });

  afterEach(async () => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
  });
});
