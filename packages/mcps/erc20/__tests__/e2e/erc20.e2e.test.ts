import { describe, beforeAll, it, expect } from '@jest/globals';
import { RpcProvider } from 'starknet';
import { getOnchainRead, getOnchainWrite } from '@kasarlabs/ask-starknet-core';
import { deployERC20Contract } from '../../src/tools/deployERC20.js';
import { getSymbol } from '../../src/tools/getSymbol.js';
import { getTotalSupply } from '../../src/tools/getTotalSupply.js';
import { getBalance } from '../../src/tools/getBalance.js';
import { approve } from '../../src/tools/approve.js';
import { getAllowance } from '../../src/tools/getAllowance.js';
import { transfer } from '../../src/tools/transfer.js';
import { transferFrom } from '../../src/tools/transferFrom.js';
import { validateToken } from '../../src/lib/utils/utils.js';

// Test context variables
let tokenAddress: string;
let owner: string;
let user_address: string;
let user_private_key: string;
let spender_address: string;
let spender_private_key: string;
let tokenDecimals: number;

function parseFormattedBalance(formatted: string, decimals: number): bigint {
  const [whole, fraction = ''] = formatted.split('.');
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(whole + paddedFraction);
}

async function getTokenDecimals(
  provider: RpcProvider,
  address: string
): Promise<number> {
  const token = await validateToken(provider, address, undefined);
  if (!token.decimals || token.decimals <= 0) {
    throw new Error(
      `Invalid token decimals: ${token.decimals}. Token decimals must be a positive number.`
    );
  }
  return token.decimals;
}

function isRecord(data: Record<string, any> | Array<any>): data is Record<string, any> {
  return !Array.isArray(data) && typeof data === 'object' && data !== null;
}

function getDataAsRecord(data: Record<string, any> | Array<any> | undefined): Record<string, any> {
  if (!data || !isRecord(data)) {
    throw new Error('Expected data to be a Record object');
  }
  return data;
}

describe('ERC20 E2E Tests', () => {
  beforeAll(async () => {

    owner = process.env.STARKNET_ACCOUNT_ADDRESS || '0x0';
    user_address = process.env.TEST_USER_ADDRESS || '0x1';
    user_private_key = process.env.TEST_USER_PRIVATE_KEY || '0x1';
    spender_address = process.env.TEST_SPENDER_ADDRESS || '0x2';
    spender_private_key = process.env.TEST_SPENDER_PRIVATE_KEY || '0x2';

    if (owner === '0x0') {
      throw new Error(
        'STARKNET_ACCOUNT_ADDRESS must be set in environment variables'
      );
    } else if (user_address === '0x1' || user_private_key === '0x1') {
      throw new Error(
        'TEST_USER_ADDRESS and TEST_USER_PRIVATE_KEY must be set in environment variables'
      );
    } else if (spender_address === '0x2' || spender_private_key === '0x2') {
      throw new Error(
        'TEST_SPENDER_ADDRESS and TEST_SPENDER_PRIVATE_KEY must be set in environment variables'
      );
    }

    // Deploy the ERC20 token
    const onchainWrite = getOnchainWrite();
    const deployResult = await deployERC20Contract(onchainWrite, {
      name: 'TestToken',
      symbol: 'TEST',
      totalSupply: '1000000', // 1,000,000 tokens with 18 decimals (default)
    });

    if (deployResult.status !== 'success' || !deployResult.data) {
      throw new Error(
        `Failed to deploy ERC20: ${deployResult.error || 'Unknown error'}`
      );
    }

    const deployData = getDataAsRecord(deployResult.data);
    tokenAddress = deployData.contractAddress as string;
    if (!tokenAddress) {
      throw new Error('Contract address is empty');
    }

    const onchainRead = getOnchainRead();
    tokenDecimals = await getTokenDecimals(onchainRead.provider, tokenAddress);
  });

  describe('Deploy ERC20 + Metadata checks', () => {
    it('should deploy the token successfully', () => {
      expect(tokenAddress).toBeDefined();
      expect(tokenAddress).not.toBe('');
      expect(tokenAddress.startsWith('0x')).toBe(true);
    });

    it('should return correct symbol', async () => {
      const onchainRead = getOnchainRead();
      const result = await getSymbol(onchainRead, {
        assetAddress: tokenAddress,
      });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.symbol).toBe('TEST');
      }
    });

    it('should return correct totalSupply', async () => {
      const onchainRead = getOnchainRead();
      const result = await getTotalSupply(onchainRead, {
        asset: {
          assetAddress: tokenAddress,
        },
      });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        const totalSupplyBigInt = parseFormattedBalance(
          data.totalSupply as string,
          tokenDecimals
        );
        const expectedTotalSupply =
          BigInt('1000000') * BigInt(10) ** BigInt(tokenDecimals);
        expect(totalSupplyBigInt).toBe(expectedTotalSupply);
      }
    });

    it('should have correct owner balance after deployment', async () => {
      const onchainRead = getOnchainRead();
      const result = await getBalance(onchainRead, {
        accountAddress: owner,
        asset: {
          assetAddress: tokenAddress,
        },
      });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        const ownerBalanceBigInt = parseFormattedBalance(
          data.balance as string,
          tokenDecimals
        );
        const expectedBalance =
          BigInt('1000000') * BigInt(10) ** BigInt(tokenDecimals);
        expect(ownerBalanceBigInt).toBe(expectedBalance);
      }
    });
  });

  describe('Approve & Allowance scenario', () => {
    it('should approve spender and verify updated allowance', async () => {
      const onchainWrite = getOnchainWrite();
      const approveAmount = '1000';

      const approveResult = await approve(onchainWrite, {
        spenderAddress: spender_address,
        amount: approveAmount,
        asset: {
          assetAddress: tokenAddress,
        },
      });

      expect(approveResult.status).toBe('success');
      if (approveResult.status === 'success' && approveResult.data) {
        const data = getDataAsRecord(approveResult.data);
        expect(data.transactionHash).toBeDefined();
      }

      const onchainRead = getOnchainRead();
      const allowanceResult = await getAllowance(onchainRead, {
        ownerAddress: owner,
        spenderAddress: spender_address,
        asset: {
          assetAddress: tokenAddress,
        },
      });

      expect(allowanceResult.status).toBe('success');
      if (allowanceResult.status === 'success' && allowanceResult.data) {
        const data = getDataAsRecord(allowanceResult.data);
        const allowanceBigInt = parseFormattedBalance(
          data.allowance as string,
          tokenDecimals
        );
        const expectedAllowance =
          BigInt(approveAmount) * BigInt(10) ** BigInt(tokenDecimals);
        expect(allowanceBigInt).toBe(expectedAllowance);
      }
    });

    it('should consume allowance when transferFrom is called', async () => {
      const onchainRead = getOnchainRead();
      const transferAmount = '500';

      const ownerBalanceBefore = await getBalance(onchainRead, {
        accountAddress: owner,
        asset: {
          assetAddress: tokenAddress,
        },
      });

      const userBalanceBefore = await getBalance(onchainRead, {
        accountAddress: user_address,
        asset: {
          assetAddress: tokenAddress,
        },
      });

      const allowanceBefore = await getAllowance(onchainRead, {
        ownerAddress: owner,
        spenderAddress: spender_address,
        asset: {
          assetAddress: tokenAddress,
        },
      });

      expect(ownerBalanceBefore.status).toBe('success');
      expect(userBalanceBefore.status).toBe('success');
      expect(allowanceBefore.status).toBe('success');

      let ownerBalanceBeforeBigInt = BigInt(0);
      let userBalanceBeforeBigInt = BigInt(0);
      let allowanceBeforeBigInt = BigInt(0);

      if (
        ownerBalanceBefore.status === 'success' &&
        ownerBalanceBefore.data
      ) {
        const data = getDataAsRecord(ownerBalanceBefore.data);
        ownerBalanceBeforeBigInt = parseFormattedBalance(
          data.balance as string,
          tokenDecimals
        );
      }

      if (userBalanceBefore.status === 'success' && userBalanceBefore.data) {
        const data = getDataAsRecord(userBalanceBefore.data);
        userBalanceBeforeBigInt = parseFormattedBalance(
          data.balance as string,
          tokenDecimals
        );
      }

      if (allowanceBefore.status === 'success' && allowanceBefore.data) {
        const data = getDataAsRecord(allowanceBefore.data);
        allowanceBeforeBigInt = parseFormattedBalance(
          data.allowance as string,
          tokenDecimals
        );
      }

      const onchainWrite = getOnchainWrite();
      const transferFromResult = await transferFrom(onchainWrite, {
        fromAddress: owner,
        toAddress: user_address,
        amount: transferAmount,
        asset: {
          assetAddress: tokenAddress,
        },
      });

      expect(transferFromResult.status).toBe('success');
      if (transferFromResult.status === 'success' && transferFromResult.data) {
        const data = getDataAsRecord(transferFromResult.data);
        expect(data.transactionHash).toBeDefined();
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));

      const ownerBalanceAfter = await getBalance(onchainRead, {
        accountAddress: owner,
        asset: {
          assetAddress: tokenAddress,
        },
      });

      const userBalanceAfter = await getBalance(onchainRead, {
        accountAddress: user_address,
        asset: {
          assetAddress: tokenAddress,
        },
      });

      expect(ownerBalanceAfter.status).toBe('success');
      expect(userBalanceAfter.status).toBe('success');

      if (
        ownerBalanceAfter.status === 'success' &&
        ownerBalanceAfter.data
      ) {
        const data = getDataAsRecord(ownerBalanceAfter.data);
        const ownerBalanceAfterBigInt = parseFormattedBalance(
          data.balance as string,
          tokenDecimals
        );
        const transferAmountBigInt =
          BigInt(transferAmount) * BigInt(10) ** BigInt(tokenDecimals);
        expect(ownerBalanceAfterBigInt).toBe(
          ownerBalanceBeforeBigInt - transferAmountBigInt
        );
      }

      if (userBalanceAfter.status === 'success' && userBalanceAfter.data) {
        const data = getDataAsRecord(userBalanceAfter.data);
        const userBalanceAfterBigInt = parseFormattedBalance(
          data.balance as string,
          tokenDecimals
        );
        const transferAmountBigInt =
          BigInt(transferAmount) * BigInt(10) ** BigInt(tokenDecimals);
        expect(userBalanceAfterBigInt).toBe(
          userBalanceBeforeBigInt + transferAmountBigInt
        );
      }

      const allowanceAfter = await getAllowance(onchainRead, {
        ownerAddress: owner,
        spenderAddress: spender_address,
        asset: {
          assetAddress: tokenAddress,
        },
      });

      expect(allowanceAfter.status).toBe('success');
      if (allowanceAfter.status === 'success' && allowanceAfter.data) {
        const data = getDataAsRecord(allowanceAfter.data);
        const allowanceAfterBigInt = parseFormattedBalance(
          data.allowance as string,
          tokenDecimals
        );
        const transferAmountBigInt =
          BigInt(transferAmount) * BigInt(10) ** BigInt(tokenDecimals);
        expect(allowanceAfterBigInt).toBe(
          allowanceBeforeBigInt - transferAmountBigInt
        );
      }
    });
  });

  describe('Simple transfer scenario', () => {
    it('should transfer tokens and verify balances updated', async () => {
      const onchainRead = getOnchainRead();
      const transferAmount = '100';

      const ownerBalanceBefore = await getBalance(onchainRead, {
        accountAddress: owner,
        asset: {
          assetAddress: tokenAddress,
        },
      });

      const userBalanceBefore = await getBalance(onchainRead, {
        accountAddress: user_address,
        asset: {
          assetAddress: tokenAddress,
        },
      });

      expect(ownerBalanceBefore.status).toBe('success');
      expect(userBalanceBefore.status).toBe('success');

      let ownerBalanceBeforeBigInt = BigInt(0);
      let userBalanceBeforeBigInt = BigInt(0);

      if (
        ownerBalanceBefore.status === 'success' &&
        ownerBalanceBefore.data
      ) {
        const data = getDataAsRecord(ownerBalanceBefore.data);
        ownerBalanceBeforeBigInt = parseFormattedBalance(
          data.balance as string,
          tokenDecimals
        );
      }

      if (userBalanceBefore.status === 'success' && userBalanceBefore.data) {
        const data = getDataAsRecord(userBalanceBefore.data);
        userBalanceBeforeBigInt = parseFormattedBalance(
          data.balance as string,
          tokenDecimals
        );
      }

      const onchainWrite = getOnchainWrite();
      const transferResult = await transfer(onchainWrite, {
        recipientAddress: user_address,
        amount: transferAmount,
        asset: {
          assetAddress: tokenAddress,
        },
      });

      expect(transferResult.status).toBe('success');
      if (transferResult.status === 'success' && transferResult.data) {
        const data = getDataAsRecord(transferResult.data);
        expect(data.transaction_hash).toBeDefined();
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));

      const ownerBalanceAfter = await getBalance(onchainRead, {
        accountAddress: owner,
        asset: {
          assetAddress: tokenAddress,
        },
      });

      const userBalanceAfter = await getBalance(onchainRead, {
        accountAddress: user_address,
        asset: {
          assetAddress: tokenAddress,
        },
      });

      expect(ownerBalanceAfter.status).toBe('success');
      expect(userBalanceAfter.status).toBe('success');

      if (
        ownerBalanceAfter.status === 'success' &&
        ownerBalanceAfter.data
      ) {
        const data = getDataAsRecord(ownerBalanceAfter.data);
        const ownerBalanceAfterBigInt = parseFormattedBalance(
          data.balance as string,
          tokenDecimals
        );
        const transferAmountBigInt =
          BigInt(transferAmount) * BigInt(10) ** BigInt(tokenDecimals);
        expect(ownerBalanceAfterBigInt).toBe(
          ownerBalanceBeforeBigInt - transferAmountBigInt
        );
      }

      if (userBalanceAfter.status === 'success' && userBalanceAfter.data) {
        const data = getDataAsRecord(userBalanceAfter.data);
        const userBalanceAfterBigInt = parseFormattedBalance(
          data.balance as string,
          tokenDecimals
        );
        const transferAmountBigInt =
          BigInt(transferAmount) * BigInt(10) ** BigInt(tokenDecimals);
        expect(userBalanceAfterBigInt).toBe(
          userBalanceBeforeBigInt + transferAmountBigInt
        );
      }
    });
  });
});
