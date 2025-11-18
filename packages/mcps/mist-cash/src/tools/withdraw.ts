import { WithdrawFromChamberParams } from '../schemas/index.js';
import { getChamber, getTxIndexInTree, fmtAmount } from '@mistcash/sdk';
import { calculateMerkleRootAndProof } from '@mistcash/crypto';
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
    const chamberContract = getChamber();

    // Initialize ERC20 token contract for info
    const tokenContract = new Contract(ERC20_ABI, tokenAddress, account);
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

    // Perform the withdraw
    console.error(`Withdrawing ${amount} tokens from chamber...`);
    const withdrawTx = await chamberContract.withdraw_no_zk(
      BigInt(claimingKey),
      recipientAddress,
      {
        amount: BigInt(amount),
        addr: tokenAddress,
      },
      merkleProof
    );

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
