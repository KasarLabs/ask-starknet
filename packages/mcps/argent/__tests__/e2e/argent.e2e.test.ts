import { describe, beforeAll, it, expect } from '@jest/globals';
import {
  getOnchainRead,
  getOnchainWrite,
  getDataAsRecord,
  getERC20Balance,
  parseFormattedBalance,
  executeV3Transaction,
  transferERC20,
} from '@kasarlabs/ask-starknet-core';
import { CreateArgentAccount } from '../../src/tools/createAccount.js';
import { DeployArgentAccount } from '../../src/tools/deployAccount.js';

// STRK token address on Starknet mainnet
const STRK_ADDRESS =
  '0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d';
const STRK_DECIMALS = 18;

let contractAddress: string;
let owner: string;
let publicKey: string;
let privateKey: string;

describe('Argent E2E Tests', () => {
  beforeAll(async () => {
    owner = process.env.STARKNET_ACCOUNT_ADDRESS || '0x0';

    if (owner === '0x0') {
      throw new Error(
        'STARKNET_ACCOUNT_ADDRESS must be set in environment variables'
      );
    }

    const onchainRead = getOnchainRead();
    const createAccountResult = await CreateArgentAccount(onchainRead);

    if (createAccountResult.status !== 'success' || !createAccountResult.data) {
      throw new Error(
        `Failed to create Argent account: ${createAccountResult.error || 'Unknown error'}`
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
    it('should create Argent account successfully', () => {
      expect(contractAddress).toBeDefined();
      expect(contractAddress).not.toBe('');
      expect(contractAddress.startsWith('0x')).toBe(true);
    });

    it('should transfer 0.05 STRK to the created account and verify balance', async () => {
      const onchainRead = getOnchainRead();
      const onchainWrite = getOnchainWrite();
      const transferAmount = '0.05';

      const balanceBefore = await getERC20Balance(
        onchainRead.provider,
        STRK_ADDRESS,
        contractAddress
      );

      const transactionHash = await transferERC20(
        onchainWrite.account,
        STRK_ADDRESS,
        contractAddress,
        transferAmount,
        STRK_DECIMALS
      );

      expect(transactionHash).toBeDefined();
      expect(transactionHash.startsWith('0x')).toBe(true);

      await new Promise((resolve) => setTimeout(resolve, 5000));

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

      const deployResult = await DeployArgentAccount(onchainRead, {
        contractAddress: contractAddress,
        publicKey: publicKey,
        privateKey: privateKey,
      });
      expect(deployResult.status).toBe('success');
      if (deployResult.status === 'success' && deployResult.data) {
        const deployData = getDataAsRecord(deployResult.data);
        expect(deployData.transaction_hash).toBeDefined();
        expect(deployData.contract_address).toBe(contractAddress);
        expect(deployData.wallet).toBe('AX');
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));
    });
  });
});
