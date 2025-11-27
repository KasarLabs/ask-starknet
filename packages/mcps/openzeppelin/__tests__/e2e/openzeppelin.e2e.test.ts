import { describe, beforeAll, it, expect } from '@jest/globals';
import {
  Contract,
  RpcProvider,
  validateAndParseAddress,
  cairo,
  Account,
  Call,
} from 'starknet';
import { getOnchainRead, getOnchainWrite } from '@kasarlabs/ask-starknet-core';
import { CreateOZAccount } from '../../src/tools/createAccount.js';
import { DeployOZAccount } from '../../src/tools/deployAccount.js';
import { ERC20_ABI } from '../../src/lib/abis/erc20Abi.js';

// STRK token address on Starknet mainnet
const STRK_ADDRESS =
  '0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d';
const STRK_DECIMALS = 18;

// Test context variables
let contractAddress: string;
let owner: string;
let publicKey: string;
let privateKey: string;

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

function parseFormattedBalance(formatted: string, decimals: number): bigint {
  const [whole, fraction = ''] = formatted.split('.');
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(whole + paddedFraction);
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

/**
 * Executes a V3 transaction
 */
async function executeV3Transaction({
  call,
  account,
}: {
  call: Call;
  account: Account;
}): Promise<string> {
  const { transaction_hash } = await account.execute(call);

  const receipt = await account.waitForTransaction(transaction_hash);
  if (!receipt.isSuccess()) {
    throw new Error('Transaction confirmed but failed');
  }

  return transaction_hash;
}

/**
 * Transfers ERC20 tokens
 */
async function transferERC20(
  account: Account,
  tokenAddress: string,
  recipientAddress: string,
  amount: string
): Promise<string> {
  const contract = new Contract({
    abi: ERC20_ABI,
    address: tokenAddress,
    providerOrAccount: account,
  });

  // Format amount with decimals
  const [whole, fraction = ''] = amount.split('.');
  const paddedFraction = fraction
    .padEnd(STRK_DECIMALS, '0')
    .slice(0, STRK_DECIMALS);
  const amountStr = whole + paddedFraction;
  const amountBigInt = BigInt(amountStr);
  const amountUint256 = cairo.uint256(amountBigInt);

  const calldata = contract.populate('transfer', {
    recipient: validateAndParseAddress(recipientAddress),
    amount: amountUint256,
  });

  const txHash = await executeV3Transaction({
    call: calldata,
    account: account,
  });

  return txHash;
}

describe('OpenZeppelin E2E Tests', () => {
  beforeAll(async () => {
    owner = process.env.STARKNET_ACCOUNT_ADDRESS || '0x0';

    if (owner === '0x0') {
      throw new Error(
        'STARKNET_ACCOUNT_ADDRESS must be set in environment variables'
      );
    }

    // Create OpenZeppelin account
    const createAccountResult = await CreateOZAccount();

    if (createAccountResult.status !== 'success' || !createAccountResult.data) {
      throw new Error(
        `Failed to create OpenZeppelin account: ${createAccountResult.error || 'Unknown error'}`
      );
    }

    const accountData = getDataAsRecord(createAccountResult.data);
    contractAddress = accountData.contractAddress as string;
    publicKey = accountData.publicKey as string;
    privateKey = accountData.privateKey as string;

    if (!contractAddress || !publicKey || !privateKey) {
      throw new Error('Account details are incomplete');
    }
  });

  describe('Create Account + Transfer STRK scenario', () => {
    it('should create OpenZeppelin account successfully', () => {
      expect(contractAddress).toBeDefined();
      expect(contractAddress).not.toBe('');
      expect(contractAddress.startsWith('0x')).toBe(true);
    });

    it('should transfer 0.005 STRK to the created account and verify balance', async () => {
      const onchainRead = getOnchainRead();
      const onchainWrite = getOnchainWrite();
      const transferAmount = '0.005';

      // Get initial balance of the created account
      const balanceBefore = await getERC20Balance(
        onchainRead.provider,
        STRK_ADDRESS,
        contractAddress
      );

      // Transfer STRK to the created account
      const transactionHash = await transferERC20(
        onchainWrite.account,
        STRK_ADDRESS,
        contractAddress,
        transferAmount
      );

      expect(transactionHash).toBeDefined();
      expect(transactionHash.startsWith('0x')).toBe(true);

      // Wait for transaction to be confirmed
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Verify the balance after transfer
      const balanceAfter = await getERC20Balance(
        onchainRead.provider,
        STRK_ADDRESS,
        contractAddress
      );

      const transferAmountBigInt = parseFormattedBalance(
        transferAmount,
        STRK_DECIMALS
      );
      expect(balanceAfter).toBe(balanceBefore + transferAmountBigInt);

      // Deploy the account after transfer
      const deployResult = await DeployOZAccount(onchainRead, {
        contractAddress: contractAddress,
        publicKey: publicKey,
        privateKey: privateKey,
      });

      expect(deployResult.status).toBe('success');
      if (deployResult.status === 'success' && deployResult.data) {
        const deployData = getDataAsRecord(deployResult.data);
        expect(deployData.transaction_hash).toBeDefined();
        expect(deployData.contract_address).toBe(contractAddress);
        expect(deployData.wallet).toBe('OpenZeppelin');
      }

      // Wait for deployment transaction to be confirmed
      await new Promise((resolve) => setTimeout(resolve, 5000));
    });
  });
});

