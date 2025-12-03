import { DepositToChamberParams } from '../schemas/index.js';
import { getChamber } from '@mistcash/sdk';
import { txSecret } from '@mistcash/crypto';
import { Contract } from 'starknet';
import { ERC20_ABI } from '@mistcash/config';
import { onchainWrite, toolResult } from '@kasarlabs/ask-starknet-core';
import { randomBytes } from 'crypto';

/**
 * Generate a random claiming key that fits in UINT256 (64 hex chars = 256 bits)
 * This replaces the SDK's generateClaimingKey which produces keys that are too long
 */
function generateUint256ClaimingKey(): string {
  // Generate 32 random bytes (256 bits)
  const randomKey = randomBytes(32);
  // Convert to hex string with 0x prefix
  return '0x' + randomKey.toString('hex');
}

/**
 * Normalize claiming key to ensure it fits in UINT256 (max 64 hex chars)
 */
function normalizeClaimingKey(key: string): string {
  if (key.startsWith('0x') && key.length > 66) {
    console.error(
      `Warning: Claiming key too long (${key.length} chars), truncating to 64 hex digits`
    );
    return '0x' + key.slice(2, 66);
  }
  return key;
}

export async function depositToChamber(
  onchainWrite: onchainWrite,
  params: DepositToChamberParams
): Promise<toolResult> {
  try {
    const { tokenAddress, amount, recipientAddress } = params;
    let { claimingKey } = params;

    // Generate claiming key if not provided
    if (!claimingKey) {
      claimingKey = generateUint256ClaimingKey();
      console.error(`Generated UINT256-compliant claiming key: ${claimingKey}`);
    } else {
      claimingKey = normalizeClaimingKey(claimingKey);
    }

    const { account } = onchainWrite;

    const chamberContract = getChamber(account);

    const tokenContract = new Contract({
      abi: ERC20_ABI,
      address: tokenAddress,
      providerOrAccount: account,
    });
    let decimals = 18;
    try {
      decimals = await tokenContract.decimals();
    } catch (e) {
      console.error('Could not fetch decimals, defaulting to 18');
    }

    // Calculate transaction secret (hash of claiming key and recipient)
    const secret = await txSecret(claimingKey, recipientAddress);
    console.error(`Transaction secret calculated: ${secret.toString()}`);
    // Approve chamber contract to spend tokens
    console.error(`Approving ${amount} tokens for chamber contract...`);
    const chamberAddress = chamberContract.address;
    const approveTx = await tokenContract.approve(chamberAddress, amount);
    await account.waitForTransaction(approveTx.transaction_hash);
    console.error(
      `Approval transaction confirmed: ${approveTx.transaction_hash}`
    );

    // Deposit into chamber
    console.error(`Depositing ${amount} tokens into chamber...`);
    const depositTx = await chamberContract.deposit(secret, {
      amount: BigInt(amount),
      addr: tokenAddress,
    });

    await account.waitForTransaction(depositTx.transaction_hash);
    console.error(
      `Deposit transaction confirmed: ${depositTx.transaction_hash}`
    );

    return {
      status: 'success',
      data: [
        JSON.stringify(
          {
            success: true,
            message: 'Successfully deposited into chamber',
            data: {
              claimingKey,
              recipientAddress,
              tokenAddress,
              amount: amount.toString(),
              decimals: Number(decimals),
              transactionHash: depositTx.transaction_hash,
              secret: secret.toString(),
            },
          },
          null,
          2
        ),
      ],
    };
  } catch (error: any) {
    console.error('Error in depositToChamber:', error);
    throw new Error(`Deposit to chamber failed: ${error.message}`);
  }
}
