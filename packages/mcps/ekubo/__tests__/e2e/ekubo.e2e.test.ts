import { describe, beforeAll, it, expect, afterEach } from '@jest/globals';
import { RpcProvider, validateAndParseAddress } from 'starknet';
import { getOnchainRead, getOnchainWrite } from '@kasarlabs/ask-starknet-core';
import { getPoolInfo } from '../../src/tools/read/getPoolInfo.js';
import { getTokenPrice } from '../../src/tools/read/getTokenPrice.js';
import { swap } from '../../src/tools/write/swap.js';
import { createPosition } from '../../src/tools/write/createPosition.js';
import { addLiquidity } from '../../src/tools/write/addLiquidity.js';
import { withdrawLiquidity } from '../../src/tools/write/withdrawLiquidity.js';
import { getPosition } from '../../src/tools/read/getPosition.js';

let accountAddress: string;

const STRK_ADDRESS =
  '0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d';
const USDC_ADDRESS =
  '0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8';

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

/**
 * Formats balance from bigint to human-readable string with decimals
 */
function formatBalance(balance: bigint, decimals: number): string {
  const divisor = BigInt(10 ** decimals);
  const whole = balance / divisor;
  const fraction = balance % divisor;

  if (fraction === 0n) {
    return whole.toString();
  }

  const fractionStr = fraction.toString().padStart(decimals, '0');
  const trimmedFraction = fractionStr.replace(/0+$/, '');
  return trimmedFraction ? `${whole}.${trimmedFraction}` : whole.toString();
}

/**
 * Gets the token balance and returns it as a formatted string
 */
async function getTokenBalanceFormatted(
  provider: RpcProvider,
  tokenAddress: string,
  accountAddress: string,
  decimals: number
): Promise<string> {
  const balance = await getERC20Balance(provider, tokenAddress, accountAddress);
  return formatBalance(balance, decimals);
}

/**
 * Helper function to calculate the amount received from a swap
 * by comparing balance before and after the swap
 */
async function calculateSwapAmountReceived(
  provider: RpcProvider,
  tokenAddress: string,
  accountAddress: string,
  balanceBefore: bigint,
  decimals: number
): Promise<string> {
  const balanceAfter = await getERC20Balance(
    provider,
    tokenAddress,
    accountAddress
  );

  const amountReceived = balanceAfter - balanceBefore;

  if (amountReceived <= 0n) {
    const balanceBeforeFormatted = formatBalance(balanceBefore, decimals);
    const balanceAfterFormatted = formatBalance(balanceAfter, decimals);
    throw new Error(
      `No tokens received from swap. Balance before: ${balanceBeforeFormatted}, Balance after: ${balanceAfterFormatted}`
    );
  }

  return formatBalance(amountReceived, decimals);
}

describe('Ekubo E2E Tests', () => {
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
    it('should get pool info for STRK/USDC pool', async () => {
      const onchainRead = getOnchainRead();
      const result = await getPoolInfo(onchainRead, {
        token0_symbol: 'STRK',
        token1_symbol: 'USDC',
        fee: 0.05,
        tick_spacing: 0.1,
        extension: '0x0',
      });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.token0).toBeDefined();
        expect(data.token1).toBeDefined();
        expect(data.price).toBeDefined();
        expect(data.sqrt_price).toBeDefined();
        expect(data.liquidity).toBeDefined();
      }
    });

    it('should get pool info using token addresses', async () => {
      const onchainRead = getOnchainRead();
      const result = await getPoolInfo(onchainRead, {
        token0_address: STRK_ADDRESS,
        token1_address: USDC_ADDRESS,
        fee: 0.05,
        tick_spacing: 0.1,
        extension: '0x0',
      });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.token0).toBeDefined();
        expect(data.token1).toBeDefined();
        expect(data.price).toBeDefined();
      }
    });

    it('should get token price for STRK in USDC', async () => {
      const onchainRead = getOnchainRead();
      const result = await getTokenPrice(onchainRead, {
        token_symbol: 'STRK',
        quote_currency_symbol: 'USDC',
        fee: 0.05,
        tick_spacing: 0.1,
        extension: '0x0',
      });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.base_token).toBeDefined();
        expect(data.quote_token).toBeDefined();
        expect(data.price).toBeDefined();
        expect(typeof data.price).toBe('number');
        expect(data.price).toBeGreaterThan(0);
      }
    });

    it('should get token price using addresses', async () => {
      const onchainRead = getOnchainRead();
      const result = await getTokenPrice(onchainRead, {
        token_address: STRK_ADDRESS,
        quote_currency_address: USDC_ADDRESS,
        fee: 0.05,
        tick_spacing: 0.1,
        extension: '0x0',
      });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.price).toBeDefined();
        expect(typeof data.price).toBe('number');
      }
    });
  });

  describe('Swap Operations', () => {
    it('should execute an exact input swap STRK to USDC and swap back to recover STRK', async () => {
      const onchainWrite = getOnchainWrite();
      const provider = onchainWrite.provider;
      const accountAddress = onchainWrite.account.address;

      const balanceBefore = await getERC20Balance(
        provider,
        USDC_ADDRESS,
        accountAddress
      );

      const swapResult = await swap(onchainWrite, {
        token_in_symbol: 'STRK',
        token_out_symbol: 'USDC',
        amount: '0.1',
        is_amount_in: true,
        slippage_tolerance: 1,
        fee: 0.05,
        tick_spacing: 0.1,
        extension: '0x0',
      });

      expect(swapResult.status).toBe('success');
      expect(swapResult.data).toBeDefined();

      const data = getDataAsRecord(swapResult.data);
      expect(data.transaction_hash).toBeDefined();
      expect(data.transaction_hash).toMatch(/^0x[0-9a-f]+$/i);
      expect(data.token_in).toBeDefined();
      expect(data.token_out).toBeDefined();
      expect(data.is_amount_in).toBe(true);

      await new Promise((resolve) => setTimeout(resolve, 5000));

      const swapAmount = await calculateSwapAmountReceived(
        provider,
        USDC_ADDRESS,
        accountAddress,
        balanceBefore,
        6
      );

      expect(swapAmount).toBeDefined();
      expect(swapAmount.length).toBeGreaterThan(0);

      const swapBackResult = await swap(onchainWrite, {
        token_in_symbol: 'USDC',
        token_out_symbol: 'STRK',
        amount: swapAmount,
        is_amount_in: true,
        slippage_tolerance: 1,
        fee: 0.05,
        tick_spacing: 0.1,
        extension: '0x0',
      });

      expect(swapBackResult.status).toBe('success');
    }, 180000);

    it('should execute an exact output swap STRK to USDC and swap back to recover STRK', async () => {
      const onchainWrite = getOnchainWrite();
      const provider = onchainWrite.provider;
      const accountAddress = onchainWrite.account.address;

      const balanceBefore = await getERC20Balance(
        provider,
        USDC_ADDRESS,
        accountAddress
      );

      const swapResult = await swap(onchainWrite, {
        token_in_symbol: 'STRK',
        token_out_symbol: 'USDC',
        amount: '0.05',
        is_amount_in: false,
        slippage_tolerance: 1,
        fee: 0.05,
        tick_spacing: 0.1,
        extension: '0x0',
      });

      expect(swapResult.status).toBe('success');
      expect(swapResult.data).toBeDefined();

      const data = getDataAsRecord(swapResult.data);
      expect(data.transaction_hash).toBeDefined();
      expect(data.transaction_hash).toMatch(/^0x[0-9a-f]+$/i);
      expect(data.token_in).toBeDefined();
      expect(data.token_out).toBeDefined();
      expect(data.is_amount_in).toBe(false);

      await new Promise((resolve) => setTimeout(resolve, 5000));

      const swapAmount = await calculateSwapAmountReceived(
        provider,
        USDC_ADDRESS,
        accountAddress,
        balanceBefore,
        6
      );

      expect(swapAmount).toBeDefined();
      expect(swapAmount.length).toBeGreaterThan(0);

      const swapBackResult = await swap(onchainWrite, {
        token_in_symbol: 'USDC',
        token_out_symbol: 'STRK',
        amount: swapAmount,
        is_amount_in: true,
        slippage_tolerance: 1,
        fee: 0.05,
        tick_spacing: 0.1,
        extension: '0x0',
      });

      expect(swapBackResult.status).toBe('success');
    }, 180000);

    it('should execute a swap using token addresses and swap back', async () => {
      const onchainWrite = getOnchainWrite();
      const provider = onchainWrite.provider;
      const accountAddress = onchainWrite.account.address;

      const balanceBefore = await getERC20Balance(
        provider,
        USDC_ADDRESS,
        accountAddress
      );

      const swapResult = await swap(onchainWrite, {
        token_in_address: STRK_ADDRESS,
        token_out_address: USDC_ADDRESS,
        amount: '0.1',
        is_amount_in: true,
        slippage_tolerance: 1,
        fee: 0.05,
        tick_spacing: 0.1,
        extension: '0x0',
      });

      expect(swapResult.status).toBe('success');
      expect(swapResult.data).toBeDefined();

      const data = getDataAsRecord(swapResult.data);
      expect(data.transaction_hash).toBeDefined();

      await new Promise((resolve) => setTimeout(resolve, 5000));

      const swapAmount = await calculateSwapAmountReceived(
        provider,
        USDC_ADDRESS,
        accountAddress,
        balanceBefore,
        6
      );

      expect(swapAmount).toBeDefined();
      expect(swapAmount.length).toBeGreaterThan(0);

      const swapBackResult = await swap(onchainWrite, {
        token_in_symbol: 'USDC',
        token_out_symbol: 'STRK',
        amount: swapAmount,
        is_amount_in: true,
        slippage_tolerance: 1,
        fee: 0.05,
        tick_spacing: 0.1,
        extension: '0x0',
      });

      expect(swapBackResult.status).toBe('success');
    }, 180000);

    it('should handle swap with insufficient balance gracefully', async () => {
      const onchainWrite = getOnchainWrite();

      const result = await swap(onchainWrite, {
        token_in_symbol: 'STRK',
        token_out_symbol: 'USDC',
        amount: '1000000',
        is_amount_in: true,
        slippage_tolerance: 1,
        fee: 0.05,
        tick_spacing: 0.1,
        extension: '0x0',
      });

      expect(result.status).toBe('failure');
      expect(result.error).toBeDefined();
    }, 120000);
  });

  describe('Liquidity Operations', () => {
    let createdPositionId: number | null = null;

    it('should create a position with STRK and USDC and recover STRK', async () => {
      const onchainWrite = getOnchainWrite();

      const onchainRead = getOnchainRead();
      const priceResult = await getTokenPrice(onchainRead, {
        token_symbol: 'STRK',
        quote_currency_symbol: 'USDC',
        fee: 0.05,
        tick_spacing: 0.1,
        extension: '0x0',
      });

      let lowerPrice = 0.1;
      let upperPrice = 10;

      if (priceResult.status === 'success' && priceResult.data) {
        const priceData = getDataAsRecord(priceResult.data);
        const currentPrice = priceData.price as number;
        lowerPrice = currentPrice * 0.5;
        upperPrice = currentPrice * 1.5;
      }

      const createResult = await createPosition(onchainWrite, {
        token0_symbol: 'STRK',
        token1_symbol: 'USDC',
        amount0: '0.1',
        amount1: '0.1',
        lower_price: lowerPrice,
        upper_price: upperPrice,
        fee: 0.05,
        tick_spacing: 0.1,
        extension: '0x0',
      });

      expect(createResult.status).toBe('success');
      expect(createResult.data).toBeDefined();

      const data = getDataAsRecord(createResult.data);
      expect(data.transaction_hash).toBeDefined();
      expect(data.position_id).toBeDefined();
      createdPositionId = data.position_id as number;

      await new Promise((resolve) => setTimeout(resolve, 5000));

      const onchainReadForPosition = getOnchainRead();
      const positionResult = await getPosition(onchainReadForPosition, {
        position_id: createdPositionId,
      });

      expect(positionResult.status).toBe('success');
      expect(positionResult.data).toBeDefined();

      const positionData = getDataAsRecord(positionResult.data);
      const liquidityAmount = positionData.liquidity as string;

      const balanceBeforeWithdraw = await getERC20Balance(
        onchainWrite.provider,
        USDC_ADDRESS,
        onchainWrite.account.address
      );

      const withdrawResult = await withdrawLiquidity(onchainWrite, {
        position_id: createdPositionId,
        liquidity_amount: liquidityAmount,
        fees_only: false,
        collect_fees: true,
      });

      expect(withdrawResult.status).toBe('success');

      await new Promise((resolve) => setTimeout(resolve, 5000));

      const swapAmount = await calculateSwapAmountReceived(
        onchainWrite.provider,
        USDC_ADDRESS,
        onchainWrite.account.address,
        balanceBeforeWithdraw,
        6
      );

      expect(swapAmount).toBeDefined();
      expect(swapAmount.length).toBeGreaterThan(0);

      const swapBackResult = await swap(onchainWrite, {
        token_in_symbol: 'USDC',
        token_out_symbol: 'STRK',
        amount: swapAmount,
        is_amount_in: true,
        slippage_tolerance: 1,
        fee: 0.05,
        tick_spacing: 0.1,
        extension: '0x0',
      });

      expect(swapBackResult.status).toBe('success');
    }, 180000);

    it('should add liquidity to an existing position and recover STRK', async () => {
      expect(createdPositionId).not.toBeNull();
      if (!createdPositionId) {
        throw new Error('No position created in previous test');
      }

      const onchainWrite = getOnchainWrite();

      const addResult = await addLiquidity(onchainWrite, {
        position_id: createdPositionId,
        amount0: '0.05',
        amount1: '0.05',
      });

      expect(addResult.status).toBe('success');
      expect(addResult.data).toBeDefined();

      const data = getDataAsRecord(addResult.data);
      expect(data.transaction_hash).toBeDefined();

      await new Promise((resolve) => setTimeout(resolve, 5000));

      const onchainReadForPosition = getOnchainRead();
      const positionResult = await getPosition(onchainReadForPosition, {
        position_id: createdPositionId,
      });

      expect(positionResult.status).toBe('success');
      expect(positionResult.data).toBeDefined();

      const positionData = getDataAsRecord(positionResult.data);
      const liquidityAmount = positionData.liquidity as string;

      const balanceBeforeWithdraw = await getERC20Balance(
        onchainWrite.provider,
        USDC_ADDRESS,
        onchainWrite.account.address
      );

      const withdrawResult = await withdrawLiquidity(onchainWrite, {
        position_id: createdPositionId,
        liquidity_amount: liquidityAmount,
        fees_only: false,
        collect_fees: true,
      });

      expect(withdrawResult.status).toBe('success');

      await new Promise((resolve) => setTimeout(resolve, 5000));

      const swapAmount = await calculateSwapAmountReceived(
        onchainWrite.provider,
        USDC_ADDRESS,
        onchainWrite.account.address,
        balanceBeforeWithdraw,
        6
      );

      expect(swapAmount).toBeDefined();
      expect(swapAmount.length).toBeGreaterThan(0);

      const swapBackResult = await swap(onchainWrite, {
        token_in_symbol: 'USDC',
        token_out_symbol: 'STRK',
        amount: swapAmount,
        is_amount_in: true,
        slippage_tolerance: 1,
        fee: 0.05,
        tick_spacing: 0.1,
        extension: '0x0',
      });

      expect(swapBackResult.status).toBe('success');
    }, 180000);

    it('should get position information', async () => {
      expect(createdPositionId).not.toBeNull();
      if (!createdPositionId) {
        throw new Error('No position created in previous test');
      }

      const onchainRead = getOnchainRead();
      const result = await getPosition(onchainRead, {
        position_id: createdPositionId,
      });

      expect(result.status).toBe('success');
      expect(result.data).toBeDefined();

      const data = getDataAsRecord(result.data);
      expect(data.position_id).toBe(createdPositionId);
      expect(data.owner_address).toBeDefined();
      expect(data.liquidity).toBeDefined();
      expect(data.token0).toBeDefined();
      expect(data.token1).toBeDefined();
    });
  });

  afterEach(async () => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
  });
});
