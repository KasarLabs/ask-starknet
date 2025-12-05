import { describe, beforeAll, it, expect, afterEach } from '@jest/globals';
import { RpcProvider, validateAndParseAddress } from 'starknet';
import { getOnchainRead, getOnchainWrite } from '@kasarlabs/ask-starknet-core';
import { getLstStats } from '../../src/tools/read/getLstStats.js';
import { getTotalStaked } from '../../src/tools/read/getTotalStaked.js';
import { getUserBalance } from '../../src/tools/read/getUserBalance.js';
import { previewStake } from '../../src/tools/read/previewStake.js';
import { previewUnstake } from '../../src/tools/read/previewUnstake.js';
import { getWithdrawRequestInfo } from '../../src/tools/read/getWithdrawRequestInfo.js';
import { stake } from '../../src/tools/write/stake.js';
import { unstake } from '../../src/tools/write/unstake.js';
import { claim } from '../../src/tools/write/claim.js';
import { parseUnits, formatUnits } from '../../src/lib/utils/formatting.js';
import { getTokenDecimals } from '../../src/lib/utils/contracts.js';

let accountAddress: string;

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

/**
 * Reads ERC20 token balance for an account
 */
async function getERC20Balance(
  provider: RpcProvider,
  tokenAddress: string,
  accountAddress: string
): Promise<bigint> {
  const contractAddress = validateAndParseAddress(tokenAddress);
  const account = validateAndParseAddress(accountAddress);

  const entrypoints: Array<'balance_of' | 'balanceOf'> = [
    'balance_of',
    'balanceOf',
  ];

  let lastErr: unknown = null;

  for (const entrypoint of entrypoints) {
    try {
      const res = await provider.callContract({
        contractAddress,
        entrypoint,
        calldata: [account],
      });

      const out: string[] = Array.isArray((res as any)?.result)
        ? (res as any).result
        : Array.isArray(res)
          ? (res as any)
          : [];

      if (out.length >= 2) {
        const low = BigInt(out[0]);
        const high = BigInt(out[1]);
        return (high << 128n) + low;
      }

      if (out.length === 1) {
        return BigInt(out[0]);
      }
    } catch (e) {
      lastErr = e;
    }
  }

  throw new Error(
    `Failed to read balance on ${contractAddress} for ${account}` +
      (lastErr instanceof Error ? ` (last error: ${lastErr.message})` : '')
  );
}

describe('Endurfi E2E Tests', () => {
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
    it('should get LST stats for all tokens', async () => {
      const onchainRead = getOnchainRead();
      const result = await getLstStats(onchainRead, {});

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.stats).toBeDefined();
        expect(Array.isArray(data.stats)).toBe(true);
        expect(data.summary).toBeDefined();
        expect(data.summary.total_assets).toBeGreaterThan(0);

        if (Array.isArray(data.stats) && data.stats.length > 0) {
          const firstStat = data.stats[0] as Record<string, any>;
          expect(firstStat.asset).toBeDefined();
          expect(firstStat.asset_address).toBeDefined();
          expect(firstStat.lst_address).toBeDefined();
          expect(firstStat.apy).toBeDefined();
          expect(firstStat.exchange_rate).toBeDefined();
        }
      }
    });

    it('should get total staked for STRK', async () => {
      const onchainRead = getOnchainRead();
      const result = await getTotalStaked(onchainRead, {
        token_type: 'STRK',
      });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.token_type).toBe('STRK');
        expect(data.underlying_token).toBeDefined();
        expect(data.liquid_token).toBeDefined();
        expect(data.total_staked).toBeDefined();
        expect(data.total_staked_formatted).toBeDefined();
      }
    });

    it('should get total staked for WBTC', async () => {
      const onchainRead = getOnchainRead();
      const result = await getTotalStaked(onchainRead, {
        token_type: 'WBTC',
      });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.token_type).toBe('WBTC');
        expect(data.total_staked).toBeDefined();
      }
    });

    it('should get user balance for STRK', async () => {
      const onchainRead = getOnchainRead();
      const result = await getUserBalance(onchainRead, {
        token_type: 'STRK',
        user_address: accountAddress,
      });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.token_type).toBe('STRK');
        expect(data.user_address).toBe(accountAddress);
        expect(data.liquid_token).toBeDefined();
        expect(data.liquid_balance).toBeDefined();
        expect(data.liquid_balance_formatted).toBeDefined();
        expect(data.underlying_token).toBeDefined();
        expect(data.underlying_value).toBeDefined();
        expect(data.underlying_value_formatted).toBeDefined();
      }
    });

    it('should get user balance using connected account', async () => {
      const onchainWrite = getOnchainWrite();
      const result = await getUserBalance(onchainWrite, {
        token_type: 'STRK',
      });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.user_address).toBeDefined();
        expect(data.liquid_balance).toBeDefined();
      }
    });

    it('should preview stake for STRK', async () => {
      const onchainRead = getOnchainRead();
      const amount = '1';
      const result = await previewStake(onchainRead, {
        token_type: 'STRK',
        amount,
      });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.token_type).toBe('STRK');
        expect(data.underlying_token).toBeDefined();
        expect(data.liquid_token).toBeDefined();
        expect(data.amount_formatted).toBe(amount);
        expect(data.estimated_shares).toBeDefined();
        expect(data.estimated_shares_formatted).toBeDefined();
        expect(BigInt(data.estimated_shares as string)).toBeGreaterThan(0n);
      }
    });

    it('should preview unstake for STRK', async () => {
      const onchainRead = getOnchainRead();
      const amount = '1';
      const result = await previewUnstake(onchainRead, {
        token_type: 'STRK',
        amount,
      });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.token_type).toBe('STRK');
        expect(data.liquid_token).toBeDefined();
        expect(data.underlying_token).toBeDefined();
        expect(data.amount_formatted).toBe(amount);
        expect(data.estimated_assets).toBeDefined();
        expect(data.estimated_assets_formatted).toBeDefined();
        expect(BigInt(data.estimated_assets as string)).toBeGreaterThan(0n);
      }
    });

    it('should handle invalid withdraw request ID gracefully', async () => {
      const onchainRead = getOnchainRead();
      const result = await getWithdrawRequestInfo(onchainRead, {
        token_type: 'STRK',
        withdraw_request_id: '999999999999999999999',
      });

      expect(result.status).toBe('failure');
      expect(result.error).toBeDefined();
    });
  });

  describe('Stake Operations', () => {
    it('should preview and execute a stake operation for STRK', async () => {
      const onchainWrite = getOnchainWrite();
      const provider = onchainWrite.provider;
      const accountAddress = onchainWrite.account.address;

      const previewAmount = '0.1';
      const decimals = getTokenDecimals('STRK');
      const previewResult = await previewStake(onchainWrite, {
        token_type: 'STRK',
        amount: previewAmount,
      });

      expect(previewResult.status).toBe('success');
      let expectedShares: string = '0';
      if (previewResult.status === 'success' && previewResult.data) {
        const previewData = getDataAsRecord(previewResult.data);
        expectedShares = previewData.estimated_shares as string;
        expect(expectedShares).not.toBe('0');
      }

      const strkAddress =
        '0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d';
      const balanceBefore = await getERC20Balance(
        provider,
        strkAddress,
        accountAddress
      );

      const previewAmountBigInt = parseUnits(previewAmount, decimals);

      if (balanceBefore < previewAmountBigInt) {
        const balanceFormatted = formatUnits(balanceBefore, decimals);
        throw new Error(
          `Insufficient STRK balance for staking test. Required: ${previewAmount} STRK, Available: ${balanceFormatted} STRK`
        );
      }

      const stakeResult = await stake(onchainWrite, {
        token_type: 'STRK',
        amount: previewAmount,
      });

      expect(stakeResult.status).toBe('success');
      if (stakeResult.status === 'success' && stakeResult.data) {
        const data = getDataAsRecord(stakeResult.data);
        expect(data.transaction_hash).toBeDefined();
        expect(data.transaction_hash).toMatch(/^0x[0-9a-f]+$/i);
        expect(data.token_type).toBe('STRK');
        expect(data.underlying_token).toBeDefined();
        expect(data.staked_amount_formatted).toBe(previewAmount);
        expect(data.liquid_token).toBeDefined();
        expect(data.received_amount).toBeDefined();
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));
    }, 180000);

    it('should handle stake with insufficient balance gracefully', async () => {
      const onchainWrite = getOnchainWrite();

      const result = await stake(onchainWrite, {
        token_type: 'STRK',
        amount: '1000000000',
      });

      expect(result.status).toBe('failure');
      expect(result.error).toBeDefined();
    }, 120000);
  });

  describe('Unstake Operations', () => {
    it('should preview and execute an unstake operation for STRK', async () => {
      const onchainWrite = getOnchainWrite();
      const provider = onchainWrite.provider;
      const accountAddress = onchainWrite.account.address;

      const balanceResult = await getUserBalance(onchainWrite, {
        token_type: 'STRK',
      });

      let liquidBalanceBigInt = 0n;
      let liquidBalanceFormatted = '0';
      if (balanceResult.status === 'success' && balanceResult.data) {
        const balanceData = getDataAsRecord(balanceResult.data);
        liquidBalanceBigInt = BigInt(balanceData.liquid_balance as string);
        liquidBalanceFormatted = balanceData.liquid_balance_formatted as string;
      }

      if (liquidBalanceBigInt === 0n) {
        throw new Error(
          'No xSTRK balance available for unstake test. Please stake some STRK first.'
        );
      }

      const decimals = getTokenDecimals('STRK');
      const unstakeAmountBigInt = liquidBalanceBigInt / 10n;
      const minAmountBigInt = parseUnits('0.01', decimals);
      const amountToUnstakeBigInt =
        unstakeAmountBigInt > minAmountBigInt
          ? unstakeAmountBigInt
          : minAmountBigInt;
      const amountToUnstake = formatUnits(amountToUnstakeBigInt, decimals);

      const previewResult = await previewUnstake(onchainWrite, {
        token_type: 'STRK',
        amount: amountToUnstake,
      });

      expect(previewResult.status).toBe('success');
      if (previewResult.status === 'success' && previewResult.data) {
        const previewData = getDataAsRecord(previewResult.data);
        expect(previewData.estimated_assets).toBeDefined();
      }

      const unstakeResult = await unstake(onchainWrite, {
        token_type: 'STRK',
        amount: amountToUnstake,
      });

      expect(unstakeResult.status).toBe('success');
      if (unstakeResult.status === 'success' && unstakeResult.data) {
        const data = getDataAsRecord(unstakeResult.data);
        expect(data.transaction_hash).toBeDefined();
        expect(data.transaction_hash).toMatch(/^0x[0-9a-f]+$/i);
        expect(data.token_type).toBe('STRK');
        expect(data.liquid_token).toBeDefined();
        expect(data.unstaked_amount_formatted).toBe(amountToUnstake);
        expect(data.withdraw_request_id).toBeDefined();
        expect(data.underlying_token).toBeDefined();
        expect(data.message).toBeDefined();
      }
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }, 180000);

    it('should handle unstake with insufficient balance gracefully', async () => {
      const onchainWrite = getOnchainWrite();

      const result = await unstake(onchainWrite, {
        token_type: 'STRK',
        amount: '1000000000',
      });

      expect(result.status).toBe('failure');
      expect(result.error).toBeDefined();
    }, 120000);
  });

  describe('Withdraw Request Operations', () => {
    it('should get withdraw request info if request exists', async () => {
      const onchainRead = getOnchainRead();
      const result = await getWithdrawRequestInfo(onchainRead, {
        token_type: 'STRK',
        withdraw_request_id: '1',
      });

      expect(result.status).toBeDefined();

      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.token_type).toBe('STRK');
        expect(data.withdraw_request_id).toBe('1');
        expect(data.assets_amount).toBeDefined();
        expect(data.shares_amount).toBeDefined();
        expect(data.is_claimed).toBeDefined();
        expect(typeof data.is_claimed).toBe('boolean');
        expect(data.is_claimable).toBeDefined();
        expect(typeof data.is_claimable).toBe('boolean');
        expect(data.status).toBeDefined();
        expect(['claimed', 'ready', 'pending']).toContain(data.status);
      } else if (result.status === 'failure') {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('Claim Operations', () => {
    it('should handle claim with invalid request ID gracefully', async () => {
      const onchainWrite = getOnchainWrite();
      const result = await claim(onchainWrite, {
        token_type: 'STRK',
        withdraw_request_id: '999999999999999999999',
      });

      expect(result.status).toBe('failure');
      expect(result.error).toBeDefined();
    }, 120000);

    it('should handle claim with already claimed request gracefully', async () => {
      const onchainWrite = getOnchainWrite();

      const result = await claim(onchainWrite, {
        token_type: 'STRK',
        withdraw_request_id: '1',
      });

      expect(result.status).toBeDefined();

      if (result.status === 'failure') {
        expect(result.error).toBeDefined();
        expect(result.error?.length).toBeGreaterThan(0);
      } else if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.transaction_hash).toBeDefined();
        expect(data.withdraw_request_id).toBe('1');
      }
    }, 120000);
  });

  afterEach(async () => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
  });
});
