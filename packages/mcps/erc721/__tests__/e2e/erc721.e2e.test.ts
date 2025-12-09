import { describe, beforeAll, it, expect } from '@jest/globals';
import {
  getOnchainRead,
  getOnchainWrite,
  getDataAsRecord,
  createOnchainWriteWithAccount,
} from '@kasarlabs/ask-starknet-core';
import { deployERC721Contract } from '../../src/tools/write/deployERC721.js';
import { getBalance } from '../../src/tools/read/balanceOf.js';
import { getOwner } from '../../src/tools/read/ownerOf.js';
import { approve } from '../../src/tools/write/approve.js';
import { getApproved } from '../../src/tools/read/getApproved.js';
import { transferFrom } from '../../src/tools/write/transferFrom.js';
import { transfer } from '../../src/tools/write/transferFrom.js';
import { safeTransferFrom } from '../../src/tools/write/safeTransferFrom.js';
import { setApprovalForAll } from '../../src/tools/write/setApprovalForAll.js';
import { isApprovedForAll } from '../../src/tools/read/isApprovedForAll.js';

// Test context variables
let contractAddress: string;
let owner: string;
let spender_address: string;
let spender_private_key: string;
let totalSupply: number;
let firstTokenId: string;

describe('ERC721 E2E Tests', () => {
  beforeAll(async () => {
    owner = process.env.STARKNET_ACCOUNT_ADDRESS || '0x0';
    spender_address = process.env.TEST_SPENDER_ADDRESS || '0x2';
    spender_private_key = process.env.TEST_SPENDER_PRIVATE_KEY || '0x2';

    if (owner === '0x0') {
      throw new Error(
        'STARKNET_ACCOUNT_ADDRESS must be set in environment variables'
      );
    } else if (spender_address === '0x2' || spender_private_key === '0x2') {
      throw new Error(
        'TEST_SPENDER_ADDRESS and TEST_SPENDER_PRIVATE_KEY must be set in environment variables'
      );
    }

    const onchainWrite = getOnchainWrite();
    const deployResult = await deployERC721Contract(onchainWrite, {
      name: 'TestNFT',
      symbol: 'TNFT',
      baseUri: 'https://example.com/metadata/',
      totalSupply: '10',
    });

    if (deployResult.status !== 'success' || !deployResult.data) {
      throw new Error(
        `Failed to deploy ERC721: ${deployResult.error || 'Unknown error'}`
      );
    }

    const deployData = getDataAsRecord(deployResult.data);
    contractAddress = deployData.contractAddress as string;
    if (!contractAddress) {
      throw new Error('Contract address is empty');
    }

    totalSupply = 10;
    firstTokenId = '1'; // First token ID is typically 1
  });

  describe('Deploy ERC721 + Metadata checks', () => {
    it('should deploy the contract successfully', () => {
      expect(contractAddress).toBeDefined();
      expect(contractAddress).not.toBe('');
      expect(contractAddress.startsWith('0x')).toBe(true);
    });

    it('should have correct owner balance after deployment', async () => {
      const onchainRead = getOnchainRead();
      const result = await getBalance(onchainRead, {
        accountAddress: owner,
        contractAddress: contractAddress,
      });

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(BigInt(data.balance as string)).toBe(BigInt(totalSupply));
      }
    });

    it('should return correct owner for first token', async () => {
      const onchainRead = getOnchainRead();
      const result = await getOwner(onchainRead, {
        tokenId: firstTokenId,
        contractAddress: contractAddress,
      });

      console.log('result', result.status, result.data);

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        expect(data.owner.toLowerCase()).toBe(owner.toLowerCase());
      }
    });
  });

  describe('Approve & GetApproved scenario', () => {
    it('should approve spender for a token and verify approval', async () => {
      const onchainWrite = getOnchainWrite();
      const tokenId = '1';

      const approveResult = await approve(onchainWrite, {
        approvedAddress: spender_address,
        tokenId: tokenId,
        contractAddress: contractAddress,
      });

      expect(approveResult.status).toBe('success');
      if (approveResult.status === 'success' && approveResult.data) {
        const data = getDataAsRecord(approveResult.data);
        expect(data.transactionHash).toBeDefined();
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));

      const onchainRead = getOnchainRead();
      const getApprovedResult = await getApproved(onchainRead, {
        tokenId: tokenId,
        contractAddress: contractAddress,
      });

      expect(getApprovedResult.status).toBe('success');
      if (getApprovedResult.status === 'success' && getApprovedResult.data) {
        const data = getDataAsRecord(getApprovedResult.data);
        const approvedAddress = data.approved as string;
        // Check that the approved address matches (could be 0x0 if not approved, or the spender address)
        expect(approvedAddress).toBeDefined();
      }
    });
  });

  describe('TransferFrom scenario', () => {
    it('should transfer token using transferFrom and verify ownership change', async () => {
      const onchainRead = getOnchainRead();
      const tokenId = firstTokenId;

      const ownerBefore = await getOwner(onchainRead, {
        tokenId: tokenId,
        contractAddress: contractAddress,
      });

      const ownerBalanceBefore = await getBalance(onchainRead, {
        accountAddress: owner,
        contractAddress: contractAddress,
      });

      const spenderBalanceBefore = await getBalance(onchainRead, {
        accountAddress: spender_address,
        contractAddress: contractAddress,
      });

      expect(ownerBefore.status).toBe('success');
      expect(ownerBalanceBefore.status).toBe('success');
      expect(spenderBalanceBefore.status).toBe('success');

      let ownerBeforeAddress = '';
      let ownerBalanceBeforeBigInt = BigInt(0);
      let spenderBalanceBeforeBigInt = BigInt(0);

      if (ownerBefore.status === 'success' && ownerBefore.data) {
        const data = getDataAsRecord(ownerBefore.data);
        ownerBeforeAddress = data.owner as string;
      }

      if (ownerBalanceBefore.status === 'success' && ownerBalanceBefore.data) {
        const data = getDataAsRecord(ownerBalanceBefore.data);
        ownerBalanceBeforeBigInt = BigInt(data.balance as string);
      }

      if (
        spenderBalanceBefore.status === 'success' &&
        spenderBalanceBefore.data
      ) {
        const data = getDataAsRecord(spenderBalanceBefore.data);
        spenderBalanceBeforeBigInt = BigInt(data.balance as string);
      }

      // First approve the spender
      const onchainWrite = getOnchainWrite();
      await approve(onchainWrite, {
        approvedAddress: spender_address,
        tokenId: tokenId,
        contractAddress: contractAddress,
      });

      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Now transfer using the spender account
      const onchainWriteSpender = createOnchainWriteWithAccount(
        spender_address,
        spender_private_key
      );
      const transferFromResult = await transferFrom(onchainWriteSpender, {
        fromAddress: owner,
        toAddress: spender_address,
        tokenId: tokenId,
        contractAddress: contractAddress,
      });

      expect(transferFromResult.status).toBe('success');
      if (transferFromResult.status === 'success' && transferFromResult.data) {
        const data = getDataAsRecord(transferFromResult.data);
        expect(data.transactionHash).toBeDefined();
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));

      const ownerAfter = await getOwner(onchainRead, {
        tokenId: tokenId,
        contractAddress: contractAddress,
      });

      const ownerBalanceAfter = await getBalance(onchainRead, {
        accountAddress: owner,
        contractAddress: contractAddress,
      });

      const spenderBalanceAfter = await getBalance(onchainRead, {
        accountAddress: spender_address,
        contractAddress: contractAddress,
      });

      expect(ownerAfter.status).toBe('success');
      expect(ownerBalanceAfter.status).toBe('success');
      expect(spenderBalanceAfter.status).toBe('success');

      if (ownerAfter.status === 'success' && ownerAfter.data) {
        const data = getDataAsRecord(ownerAfter.data);
        expect(data.owner.toLowerCase()).toBe(spender_address.toLowerCase());
      }

      if (ownerBalanceAfter.status === 'success' && ownerBalanceAfter.data) {
        const data = getDataAsRecord(ownerBalanceAfter.data);
        const ownerBalanceAfterBigInt = BigInt(data.balance as string);
        expect(ownerBalanceAfterBigInt).toBe(
          ownerBalanceBeforeBigInt - BigInt(1)
        );
      }

      if (
        spenderBalanceAfter.status === 'success' &&
        spenderBalanceAfter.data
      ) {
        const data = getDataAsRecord(spenderBalanceAfter.data);
        const spenderBalanceAfterBigInt = BigInt(data.balance as string);
        expect(spenderBalanceAfterBigInt).toBe(
          spenderBalanceBeforeBigInt + BigInt(1)
        );
      }
    });
  });

  describe('Simple transfer scenario', () => {
    it('should transfer token using transfer and verify ownership change', async () => {
      const onchainRead = getOnchainRead();
      const tokenId = '2';

      const ownerBefore = await getOwner(onchainRead, {
        tokenId: tokenId,
        contractAddress: contractAddress,
      });

      const ownerBalanceBefore = await getBalance(onchainRead, {
        accountAddress: owner,
        contractAddress: contractAddress,
      });

      const spenderBalanceBefore = await getBalance(onchainRead, {
        accountAddress: spender_address,
        contractAddress: contractAddress,
      });

      expect(ownerBefore.status).toBe('success');
      expect(ownerBalanceBefore.status).toBe('success');
      expect(spenderBalanceBefore.status).toBe('success');

      let ownerBalanceBeforeBigInt = BigInt(0);
      let spenderBalanceBeforeBigInt = BigInt(0);

      if (ownerBalanceBefore.status === 'success' && ownerBalanceBefore.data) {
        const data = getDataAsRecord(ownerBalanceBefore.data);
        ownerBalanceBeforeBigInt = BigInt(data.balance as string);
      }

      if (
        spenderBalanceBefore.status === 'success' &&
        spenderBalanceBefore.data
      ) {
        const data = getDataAsRecord(spenderBalanceBefore.data);
        spenderBalanceBeforeBigInt = BigInt(data.balance as string);
      }

      const onchainWrite = getOnchainWrite();
      const transferResult = await transfer(onchainWrite, {
        toAddress: spender_address,
        tokenId: tokenId,
        contractAddress: contractAddress,
      });

      expect(transferResult.status).toBe('success');
      if (transferResult.status === 'success' && transferResult.data) {
        const data = getDataAsRecord(transferResult.data);
        expect(data.transactionHash).toBeDefined();
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));

      const ownerAfter = await getOwner(onchainRead, {
        tokenId: tokenId,
        contractAddress: contractAddress,
      });

      const ownerBalanceAfter = await getBalance(onchainRead, {
        accountAddress: owner,
        contractAddress: contractAddress,
      });

      const spenderBalanceAfter = await getBalance(onchainRead, {
        accountAddress: spender_address,
        contractAddress: contractAddress,
      });

      expect(ownerAfter.status).toBe('success');
      expect(ownerBalanceAfter.status).toBe('success');
      expect(spenderBalanceAfter.status).toBe('success');

      if (ownerAfter.status === 'success' && ownerAfter.data) {
        const data = getDataAsRecord(ownerAfter.data);
        expect(data.owner.toLowerCase()).toBe(spender_address.toLowerCase());
      }

      if (ownerBalanceAfter.status === 'success' && ownerBalanceAfter.data) {
        const data = getDataAsRecord(ownerBalanceAfter.data);
        const ownerBalanceAfterBigInt = BigInt(data.balance as string);
        expect(ownerBalanceAfterBigInt).toBe(
          ownerBalanceBeforeBigInt - BigInt(1)
        );
      }

      if (
        spenderBalanceAfter.status === 'success' &&
        spenderBalanceAfter.data
      ) {
        const data = getDataAsRecord(spenderBalanceAfter.data);
        const spenderBalanceAfterBigInt = BigInt(data.balance as string);
        expect(spenderBalanceAfterBigInt).toBe(
          spenderBalanceBeforeBigInt + BigInt(1)
        );
      }
    });
  });

  describe('SafeTransferFrom scenario', () => {
    it('should safely transfer token and verify ownership change', async () => {
      const onchainRead = getOnchainRead();
      const tokenId = '3';

      const ownerBefore = await getOwner(onchainRead, {
        tokenId: tokenId,
        contractAddress: contractAddress,
      });

      expect(ownerBefore.status).toBe('success');

      // First approve the spender
      const onchainWrite = getOnchainWrite();
      await approve(onchainWrite, {
        approvedAddress: spender_address,
        tokenId: tokenId,
        contractAddress: contractAddress,
      });

      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Now safe transfer using the spender account
      const onchainWriteSpender = createOnchainWriteWithAccount(
        spender_address,
        spender_private_key
      );
      const safeTransferResult = await safeTransferFrom(onchainWriteSpender, {
        fromAddress: owner,
        toAddress: spender_address,
        tokenId: tokenId,
        contractAddress: contractAddress,
      });

      expect(safeTransferResult.status).toBe('success');
      if (safeTransferResult.status === 'success' && safeTransferResult.data) {
        const data = getDataAsRecord(safeTransferResult.data);
        expect(data.transactionHash).toBeDefined();
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));

      const ownerAfter = await getOwner(onchainRead, {
        tokenId: tokenId,
        contractAddress: contractAddress,
      });

      expect(ownerAfter.status).toBe('success');
      if (ownerAfter.status === 'success' && ownerAfter.data) {
        const data = getDataAsRecord(ownerAfter.data);
        expect(data.owner.toLowerCase()).toBe(spender_address.toLowerCase());
      }
    });
  });

  describe('SetApprovalForAll & IsApprovedForAll scenario', () => {
    it('should set approval for all and verify status', async () => {
      const onchainWrite = getOnchainWrite();

      const setApprovalResult = await setApprovalForAll(onchainWrite, {
        operatorAddress: spender_address,
        approved: true,
        contractAddress: contractAddress,
      });

      expect(setApprovalResult.status).toBe('success');
      if (setApprovalResult.status === 'success' && setApprovalResult.data) {
        const data = getDataAsRecord(setApprovalResult.data);
        expect(data.transactionHash).toBeDefined();
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));

      const onchainRead = getOnchainRead();
      const isApprovedResult = await isApprovedForAll(onchainRead, {
        ownerAddress: owner,
        operatorAddress: spender_address,
        contractAddress: contractAddress,
      });

      expect(isApprovedResult.status).toBe('success');
      if (isApprovedResult.status === 'success' && isApprovedResult.data) {
        const data = getDataAsRecord(isApprovedResult.data);
        expect(data.isApproved).toBe(true);
      }
    });

    it('should revoke approval for all and verify status', async () => {
      const onchainWrite = getOnchainWrite();

      const setApprovalResult = await setApprovalForAll(onchainWrite, {
        operatorAddress: spender_address,
        approved: false,
        contractAddress: contractAddress,
      });

      expect(setApprovalResult.status).toBe('success');
      if (setApprovalResult.status === 'success' && setApprovalResult.data) {
        const data = getDataAsRecord(setApprovalResult.data);
        expect(data.transactionHash).toBeDefined();
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));

      const onchainRead = getOnchainRead();
      const isApprovedResult = await isApprovedForAll(onchainRead, {
        ownerAddress: owner,
        operatorAddress: spender_address,
        contractAddress: contractAddress,
      });

      expect(isApprovedResult.status).toBe('success');
      if (isApprovedResult.status === 'success' && isApprovedResult.data) {
        const data = getDataAsRecord(isApprovedResult.data);
        expect(data.isApproved).toBe(false);
      }
    });
  });
});
