import { DepositToChamberParams } from '../schemas/index.js';
import { getChamber } from '@mistcash/sdk';
import { txSecret, generateClaimingKey } from '@mistcash/crypto';
import { Contract } from 'starknet';
import { ERC20_ABI } from '@mistcash/config';
import { onchainWrite } from '@kasarlabs/ask-starknet-core';

export async function depositToChamber(
  onchainWrite: onchainWrite,
  params: DepositToChamberParams
): Promise<string> {
  try {
    const { tokenAddress, amount, recipientAddress } = params;
    let { claimingKey } = params;

    // Generate claiming key if not provided
    if (!claimingKey) {
      claimingKey = generateClaimingKey();
      console.error(`Generated claiming key: ${claimingKey}`);
    }

    const { account } = onchainWrite;

    // Initialize chamber contract
    const chamberContract = getChamber();

    // Initialize ERC20 token contract
    const tokenContract = new Contract(ERC20_ABI, tokenAddress, account);
    // Get token decimals for better display
    let decimals = 18;
    try {
      decimals = await tokenContract.decimals();
    } catch (e) {
      console.error('Could not fetch decimals, defaulting to 18');
    }

    // Calculate transaction secret (hash of claiming key and recipient)
    const secret = await txSecret(claimingKey, recipientAddress);

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

    return JSON.stringify(
      {
        success: true,
        message: 'Successfully deposited into chamber',
        data: {
          claimingKey,
          recipientAddress,
          tokenAddress,
          amount,
          decimals,
          transactionHash: depositTx.transaction_hash,
          secret: secret.toString(),
        },
      },
      null,
      2
    );
  } catch (error: any) {
    console.error('Error in depositToChamber:', error);
    throw new Error(`Deposit to chamber failed: ${error.message}`);
  }
}
