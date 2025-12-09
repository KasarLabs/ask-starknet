import { describe, beforeAll, it, expect } from '@jest/globals';
import { RpcProvider, validateAndParseAddress } from 'starknet';
import {
  getOnchainRead,
  getOnchainWrite,
  ethTokenAddresses,
} from '@kasarlabs/ask-starknet-core';
import { bridgeL2toL1 } from '../../src/tools/bridgeL2toL1.js';
import { getEthereumWrite } from '../../src/lib/utils.js';
import * as ethers from 'ethers';

// STRK token address on Starknet mainnet
const STRK_ADDRESS =
  '0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d';
const STRK_DECIMALS = 18;

let starknetAccountAddress: string;
let ethereumRecipientAddress: string;

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

  // Try balance_of first, then balanceOf
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

      // Uint256 is returned as [low, high] pair
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

function parseFormattedBalance(formatted: string, decimals: number): bigint {
  const [whole, fraction = ''] = formatted.split('.');
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(whole + paddedFraction);
}

/**
 * Reads ERC20 token balance for an account on Ethereum
 */
async function getERC20BalanceEthereum(
  provider: ethers.ethers.JsonRpcProvider,
  tokenAddress: string,
  accountAddress: string
): Promise<bigint> {
  const tokenContract = new ethers.ethers.Contract(
    tokenAddress,
    ['function balanceOf(address) view returns (uint256)'],
    provider
  );
  return await tokenContract.balanceOf(accountAddress);
}

describe('StarkGate E2E Tests', () => {
  beforeAll(async () => {
    starknetAccountAddress = process.env.STARKNET_ACCOUNT_ADDRESS || '0x0';

    if (starknetAccountAddress === '0x0') {
      throw new Error(
        'STARKNET_ACCOUNT_ADDRESS must be set in environment variables'
      );
    }

    if (!process.env.STARKNET_RPC_URL) {
      throw new Error('STARKNET_RPC_URL must be set in environment variables');
    }

    if (!process.env.ETHEREUM_RPC_URL) {
      throw new Error('ETHEREUM_RPC_URL must be set in environment variables');
    }

    if (!process.env.ETHEREUM_PRIVATE_KEY) {
      throw new Error(
        'ETHEREUM_PRIVATE_KEY must be set in environment variables'
      );
    }

    const ethEnv = getEthereumWrite();
    ethereumRecipientAddress = ethEnv.wallet.address;
  });

  describe('Read Operations', () => {
    it('should read STRK balance on Starknet', async () => {
      const onchainRead = getOnchainRead();

      const balance = await getERC20Balance(
        onchainRead.provider,
        STRK_ADDRESS,
        starknetAccountAddress
      );

      expect(balance).toBeDefined();
      expect(typeof balance).toBe('bigint');
      expect(balance).toBeGreaterThanOrEqual(0n);
    });

    it('should read STRK balance on Ethereum', async () => {
      const ethEnv = getEthereumWrite();
      const strkTokenAddress = ethTokenAddresses['STRK'];

      if (!strkTokenAddress) {
        throw new Error('STRK token address not found on Ethereum');
      }

      const balance = await getERC20BalanceEthereum(
        ethEnv.provider,
        strkTokenAddress,
        ethEnv.wallet.address
      );

      expect(balance).toBeDefined();
      expect(typeof balance).toBe('bigint');
      expect(balance).toBeGreaterThanOrEqual(0n);
    });

    it('should read ETH balance on Ethereum', async () => {
      const ethEnv = getEthereumWrite();

      const balance = await ethEnv.provider.getBalance(ethEnv.wallet.address);

      expect(balance).toBeDefined();
      expect(typeof balance).toBe('bigint');
      expect(balance).toBeGreaterThanOrEqual(0n);
    });
  });

  describe('Bridge L2 to L1 - Transfer STRK to Ethereum', () => {
    it('should bridge 1 STRK from Starknet to Ethereum wallet', async () => {
      const onchainRead = getOnchainRead();
      const onchainWrite = getOnchainWrite();
      const bridgeAmount = '1';

      const balanceBefore = await getERC20Balance(
        onchainRead.provider,
        STRK_ADDRESS,
        starknetAccountAddress
      );

      const bridgeAmountBigInt = parseFormattedBalance(
        bridgeAmount,
        STRK_DECIMALS
      );
      if (balanceBefore < bridgeAmountBigInt) {
        throw new Error(
          `Insufficient STRK balance. Required: ${bridgeAmount} STRK, Available: ${ethers.formatUnits(balanceBefore, STRK_DECIMALS)} STRK`
        );
      }

      const bridgeResult = await bridgeL2toL1(onchainWrite, {
        toAddress: ethereumRecipientAddress,
        amount: bridgeAmount,
        symbol: 'STRK',
      });

      expect(bridgeResult.status).toBe('success');
      if (bridgeResult.status === 'success' && bridgeResult.data) {
        const bridgeData = getDataAsRecord(bridgeResult.data);
        expect(bridgeData.transactionHash).toBeDefined();
        expect(bridgeData.transactionHash).toMatch(/^0x[0-9a-fA-F]+$/);
        expect(bridgeData.amount).toBe(bridgeAmount);
        expect(bridgeData.symbol).toBe('STRK');
        expect(bridgeData.from.toLowerCase()).toBe(
          starknetAccountAddress.toLowerCase()
        );
        expect(bridgeData.to.toLowerCase()).toBe(
          ethereumRecipientAddress.toLowerCase()
        );
      } else {
        throw new Error(
          `Bridge failed: ${bridgeResult.error || 'Unknown error'}`
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 10000));

      const balanceAfter = await getERC20Balance(
        onchainRead.provider,
        STRK_ADDRESS,
        starknetAccountAddress
      );

      const balanceDifference = balanceBefore - balanceAfter;

      expect(balanceAfter).toBeLessThan(balanceBefore);
      expect(balanceDifference).toBeGreaterThanOrEqual(bridgeAmountBigInt);
    });
  });
});
