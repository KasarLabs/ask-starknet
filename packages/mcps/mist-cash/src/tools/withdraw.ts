import { WithdrawFromChamberParams } from '../schemas/index.js';
import { getChamber, getTxIndexInTree, fmtAmount } from '@mistcash/sdk';
import {
  calculateMerkleRootAndProof,
  calculateMerkleRoot,
  txHash,
  txSecret,
} from '@mistcash/crypto';
import { Contract, AccountInterface, ProviderInterface } from 'starknet';
import { ERC20_ABI, WitnessData } from '@mistcash/config';
import { onchainWrite, toolResult } from '@kasarlabs/ask-starknet-core';
import { CHAMBER_ABI } from '@mistcash/config';
export async function withdrawFromChamber(
  onchainWrite: onchainWrite,
  params: WithdrawFromChamberParams
): Promise<toolResult> {
  try {
    const { claimingKey, recipientAddress, tokenAddress, amount } = params;
    const { account } = onchainWrite;
    const chamberContract = getChamber(account);

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

    console.error('Fetching transaction tree and merkle root...');
    console.log(claimingKey);
    console.log(recipientAddress);
    console.log(tokenAddress);
    console.log(amount);
    const tx_hash = await txHash(
      claimingKey,
      recipientAddress,
      tokenAddress,
      amount
    );
    console.error('Transaction Hash:', tx_hash.toString());

    const allTransactions = (await chamberContract.tx_array()) as bigint[];
    const txIndex = await getTxIndexInTree(
      allTransactions,
      claimingKey,
      recipientAddress,
      tokenAddress,
      amount
    );
    if (txIndex === -1) {
      throw new Error('Transaction not found in merkle tree');
    }
    console.error('Transaction Index in Tree:', txIndex);
    console.error('Total transactions in chamber:', allTransactions.length);

    const merkleProofWRoot = calculateMerkleRootAndProof(
      allTransactions,
      txIndex
    );
    console.error('Calculating Merkle Proof...');
    const merkleProof = merkleProofWRoot
      .slice(0, merkleProofWRoot.length - 1)
      .map((bi) => {
        if (bi) {
          console.log(bi);
          return bi.toString();
        }
        return '0';
      });
    const formattedMerkleProof = [
      ...merkleProof,
      ...new Array(20 - merkleProof.length).fill('0'),
    ];
    if (!formattedMerkleProof || formattedMerkleProof.length === 0) {
      throw new Error('Merkle proof could not be generated');
    }
    console.error('Merkle Proof:', formattedMerkleProof);
    const formattedAmount = fmtAmount(BigInt(amount), Number(decimals));

    const withdrawTx = await chamberContract.withdraw_no_zk(
      BigInt(claimingKey),
      account.address,
      {
        amount: BigInt(amount),
        addr: tokenAddress,
      },
      formattedMerkleProof
    );

    await account.waitForTransaction(withdrawTx.transaction_hash);
    console.error(
      `Withdraw transaction confirmed: ${withdrawTx.transaction_hash}`
    );

    return {
      status: 'success',
      data: [
        JSON.stringify(
          {
            success: true,
            message: 'Successfully withdrawn from chamber',
            data: {
              recipientAddress,
              tokenAddress,
              amount: amount.toString(),
              formattedAmount,
              decimals: Number(decimals),
              transactionHash: withdrawTx.transaction_hash,
              merkleProofLength: merkleProof.length,
            },
          },
          null,
          2
        ),
      ],
    };
  } catch (error: any) {
    console.error('Error in withdrawFromChamber:', error);
    throw new Error(`Withdraw from chamber failed: ${error.message}`);
  }
}
