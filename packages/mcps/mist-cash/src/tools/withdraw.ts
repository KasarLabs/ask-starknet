import { WithdrawFromChamberParams } from '../schemas/index.js';
import { getChamber, getTxIndexInTree, fmtAmount } from '@mistcash/sdk';
import {
  calculateMerkleRootAndProof,
  calculateMerkleRoot,
  txHash,
} from '@mistcash/crypto';
import { Contract, AccountInterface, ProviderInterface } from 'starknet';
import { ERC20_ABI } from '@mistcash/config';
import { onchainWrite } from '@kasarlabs/ask-starknet-core';

export async function withdrawFromChamber(
  onchainWrite: onchainWrite,
  params: WithdrawFromChamberParams
): Promise<string> {
  try {
    const { claimingKey, recipientAddress, tokenAddress, amount } = params;
    const { account } = onchainWrite;
    // Cast to AccountInterface as the Account class implements the interface
    const chamberContract = getChamber(account);

    // Initialize ERC20 token contract for info
    const tokenContract = new Contract({
      abi: ERC20_ABI,
      address: tokenAddress,
      providerOrAccount: account,
    });
    // Get token decimals for better display
    let decimals = 18;
    try {
      decimals = await tokenContract.decimals();
    } catch (e) {
      console.error('Could not fetch decimals, defaulting to 18');
    }

    // Fetch all transactions from the chamber
    console.error('Fetching transaction tree...');
    const allTransactions = await chamberContract.tx_array();

    if (!allTransactions || allTransactions.length === 0) {
      throw new Error('No transactions found in the chamber');
    }

    console.error(`Found ${allTransactions.length} transactions in the tree`);

    // Find the index of the transaction in the tree
    console.error('Searching for transaction in merkle tree...');

    // Debug: Calculate what we're looking for
    const expectedTxHash = await txHash(
      claimingKey,
      recipientAddress,
      tokenAddress,
      amount
    );
    console.error(`Looking for txHash: ${expectedTxHash.toString(16)}`);
    console.error(
      `First few transactions in tree: ${(allTransactions as bigint[]).slice(0, 3).map((tx) => tx.toString(16))}`
    );

    const txIndex = await getTxIndexInTree(
      allTransactions as bigint[],
      claimingKey,
      recipientAddress,
      tokenAddress,
      amount
    );

    if (txIndex === -1) {
      throw new Error(
        'Transaction not found in merkle tree. It may have already been withdrawn or does not exist.'
      );
    }

    console.error(`Transaction found at index ${txIndex}`);

    // Calculate merkle proof
    console.error('Calculating merkle proof...');
    const merkleProof = calculateMerkleRootAndProof(
      allTransactions as bigint[],
      txIndex
    );

    console.error(
      `Merkle proof calculated with ${merkleProof.length} elements`
    );
    console.error(
      `Merkle proof: ${JSON.stringify(merkleProof.map((p) => p.toString(16)))}`
    );

    // Verify merkle root matches on-chain
    const calculatedRoot = calculateMerkleRoot(allTransactions as bigint[]);
    const onchainRoot = await chamberContract.merkle_root();
    console.error(`Calculated merkle root: ${calculatedRoot.toString(16)}`);
    console.error(`On-chain merkle root: ${onchainRoot.toString(16)}`);

    if (calculatedRoot !== onchainRoot) {
      throw new Error(
        `Merkle root mismatch! The transaction tree has changed since fetching. ` +
          `Expected: ${onchainRoot.toString(16)}, Got: ${calculatedRoot.toString(16)}. ` +
          `This usually means new transactions were added to the chamber. Please retry.`
      );
    }

    // Perform the withdraw
    console.error(`Withdrawing ${amount} tokens from chamber...`);
    console.error(`Using claiming key: ${claimingKey}`);
    console.error(`Claiming key as BigInt: ${BigInt(claimingKey).toString()}`);
    console.error(`Recipient: ${recipientAddress}`);
    console.error(`Token: ${tokenAddress}`);
    console.error(`Amount: ${amount}`);

    const withdrawCall = chamberContract.populate('withdraw_no_zk', [
      BigInt(claimingKey),
      recipientAddress,
      {
        amount: BigInt(amount),
        addr: tokenAddress,
      },
      merkleProof,
    ]);

    const withdrawTx = await account.execute(withdrawCall);

    await account.waitForTransaction(withdrawTx.transaction_hash);
    console.error(
      `Withdraw transaction confirmed: ${withdrawTx.transaction_hash}`
    );

    // Format amount for display
    const formattedAmount = fmtAmount(BigInt(amount), decimals);

    return JSON.stringify(
      {
        success: true,
        message: 'Successfully withdrawn from chamber',
        data: {
          recipientAddress,
          tokenAddress,
          amount,
          formattedAmount,
          decimals,
          transactionHash: withdrawTx.transaction_hash,
          merkleProofLength: merkleProof.length,
        },
      },
      null,
      2
    );
  } catch (error: any) {
    console.error('Error in withdrawFromChamber:', error);
    throw new Error(`Withdraw from chamber failed: ${error.message}`);
  }
}
