import { DepositToChamberParams } from '../schemas/index.js';
import { getChamber } from '@mistcash/sdk';
import { txSecret } from '@mistcash/crypto';
import { Contract } from 'starknet';
import { ERC20_ABI } from '@mistcash/config';
import {
  onchainWrite,
  toolResult,
  starknetTokenAddresses,
  getStarknetTokenAbi,
  type StarknetTokenSymbol,
} from '@kasarlabs/ask-starknet-core';
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
    const { symbol, amount, recipientAddress } = params;
    let { claimingKey } = params;

    // Resolve token symbol to address
    const tokenAddress = starknetTokenAddresses[symbol];
    if (!tokenAddress) {
      throw new Error(
        `Token address not found for symbol: ${symbol}. Supported tokens: ETH, STRK, USDC, USDT, WBTC, SWSS`
      );
    }

    console.error(`Using token ${symbol} at address: ${tokenAddress}`);

    // Generate claiming key if not provided
    if (!claimingKey) {
      claimingKey = generateUint256ClaimingKey();
      console.error(`Generated UINT256-compliant claiming key: ${claimingKey}`);
    } else {
      claimingKey = normalizeClaimingKey(claimingKey);
    }

    const { account } = onchainWrite;

    const chamberContract = getChamber(account);

    // Get the appropriate ABI for the token
    const tokenAbi = getStarknetTokenAbi(symbol as StarknetTokenSymbol);
    const tokenContract = new Contract({
      abi: tokenAbi,
      address: tokenAddress,
      providerOrAccount: account,
    });

    // Fetch decimals from the token contract - this is required
    let decimals: number;
    try {
      const decimalsResult = await tokenContract.decimals();
      decimals = Number(decimalsResult);
      console.error(`Fetched decimals for token: ${decimals}`);
    } catch (e) {
      throw new Error(
        `Failed to fetch decimals from token contract at ${tokenAddress}. ` +
          `The token contract must implement the decimals() function. Error: ${e instanceof Error ? e.message : String(e)}`
      );
    }

    // Convert standard amount to wei (smallest token units)
    // For example: "1" USDC with 6 decimals becomes "1000000"
    const amountInWei = BigInt(
      Math.floor(parseFloat(amount) * Math.pow(10, decimals))
    );
    console.error(
      `Converting ${amount} tokens to ${amountInWei.toString()} wei (${decimals} decimals)`
    );

    // Calculate transaction secret (hash of claiming key and recipient)
    const secret = await txSecret(claimingKey, recipientAddress);
    console.error(`Transaction secret calculated: ${secret.toString()}`);
    // Approve chamber contract to spend tokens
    console.error(
      `Approving ${amountInWei.toString()} wei for chamber contract...`
    );
    const chamberAddress = chamberContract.address;
    const approveTx = await tokenContract.approve(chamberAddress, amountInWei);
    await account.waitForTransaction(approveTx.transaction_hash);
    console.error(
      `Approval transaction confirmed: ${approveTx.transaction_hash}`
    );

    // Deposit into chamber
    console.error(`Depositing ${amountInWei.toString()} wei into chamber...`);
    const depositTx = await chamberContract.deposit(secret, {
      amount: amountInWei,
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
              symbol,
              tokenAddress,
              amount: amount, // User-friendly amount (e.g., "1")
              amountInWei: amountInWei.toString(), // Wei amount (e.g., "1000000")
              decimals: decimals,
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
