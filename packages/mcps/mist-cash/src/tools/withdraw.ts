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
import {
  onchainWrite,
  toolResult,
  starknetTokenAddresses,
} from '@kasarlabs/ask-starknet-core';
import { CHAMBER_ABI } from '@mistcash/config';

export async function withdrawFromChamber(
  onchainWrite: onchainWrite,
  params: WithdrawFromChamberParams
): Promise<toolResult> {
  try {
    const { claimingKey, recipientAddress, symbol, amount } = params;

    // Resolve token symbol to address
    const tokenAddress = starknetTokenAddresses[symbol];
    if (!tokenAddress) {
      throw new Error(`Token symbol ${symbol} is not supported`);
    }
    console.error(`Using token ${symbol} at address: ${tokenAddress}`);
    const { account } = onchainWrite;
    const chamberContract = getChamber(account);

    const tokenContract = new Contract({
      abi: ERC20_ABI,
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

    console.error('Fetching transaction tree and merkle root...');
    const tx_hash = await txHash(
      claimingKey,
      recipientAddress,
      tokenAddress,
      amountInWei.toString()
    );
    console.error('Transaction Hash:', tx_hash.toString());

    const allTransactions = (await chamberContract.tx_array()) as bigint[];
    const txIndex = await getTxIndexInTree(
      allTransactions,
      claimingKey,
      recipientAddress,
      tokenAddress,
      amountInWei.toString()
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
    const formattedAmount = fmtAmount(amountInWei, decimals);

    const withdrawTx = await chamberContract.withdraw_no_zk(
      BigInt(claimingKey),
      account.address,
      {
        amount: amountInWei,
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
              symbol,
              tokenAddress,
              amount: amount, // User-friendly amount (e.g., "1")
              amountInWei: amountInWei.toString(), // Wei amount (e.g., "1000000")
              formattedAmount,
              decimals: decimals,
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
