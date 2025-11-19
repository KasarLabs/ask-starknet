import { GetChamberInfoParams } from '../schemas/index.js';
import {
  getChamber,
  fetchTxAssets,
  checkTxExists,
  fmtAmount,
} from '@mistcash/sdk';
import { Contract } from 'starknet';
import { ERC20_ABI } from '@mistcash/config';
import { onchainRead } from '@kasarlabs/ask-starknet-core';

export async function getChamberInfo(
  onchainRead: onchainRead,
  params: GetChamberInfoParams
): Promise<string> {
  try {
    let { claimingKey, recipientAddress } = params;

    // Normalize claiming key - ensure it's valid UINT256 (max 64 hex chars)
    if (claimingKey.startsWith('0x') && claimingKey.length > 66) {
      console.error(
        `Warning: Claiming key too long (${claimingKey.length} chars), truncating to 64 hex digits`
      );
      claimingKey = '0x' + claimingKey.slice(2, 66);
    }

    const { provider } = onchainRead;

    // Initialize chamber contract with provider
    const chamberContract = getChamber(provider);

    // Fetch transaction assets
    console.error(
      `Fetching chamber info for claiming key: ${claimingKey.substring(0, 10)}...`
    );
    const asset = await fetchTxAssets(
      chamberContract,
      claimingKey,
      recipientAddress
    );

    if (!asset || !asset.addr || asset.amount === 0n) {
      return JSON.stringify(
        {
          success: false,
          message:
            'No chamber found for the provided claiming key and recipient',
          data: {
            claimingKey,
            recipientAddress,
            found: false,
          },
        },
        null,
        2
      );
    }

    // Get token information
    const tokenContract = new Contract({
      abi: ERC20_ABI,
      address: asset.addr,
      providerOrAccount: provider,
    });

    let tokenName = 'Unknown';
    let tokenSymbol = 'UNKNOWN';
    let decimals = 18;

    try {
      const [name, symbol, dec] = await Promise.all([
        tokenContract.name().catch(() => 'Unknown'),
        tokenContract.symbol().catch(() => 'UNKNOWN'),
        tokenContract.decimals().catch(() => 18),
      ]);
      tokenName = name;
      tokenSymbol = symbol;
      // Ensure decimals is a number, not BigInt
      decimals = typeof dec === 'bigint' ? Number(dec) : Number(dec);
    } catch (e) {
      console.error('Could not fetch token details');
    }

    // Check if transaction exists in the merkle tree
    const txExists = await checkTxExists(
      chamberContract,
      claimingKey,
      recipientAddress,
      asset.addr,
      asset.amount.toString()
    );

    // Format amount for display
    const formattedAmount = fmtAmount(asset.amount, decimals);

    return JSON.stringify(
      {
        success: true,
        message: 'Chamber info retrieved successfully',
        data: {
          found: true,
          exists: txExists,
          claimingKey,
          recipientAddress,
          tokenAddress: asset.addr,
          tokenName,
          tokenSymbol,
          amount: asset.amount.toString(),
          formattedAmount,
          decimals,
          warning: txExists
            ? 'Transaction exists in merkle tree (can be withdrawn)'
            : 'Transaction NOT found in merkle tree (may have been withdrawn already)',
        },
      },
      null,
      2
    );
  } catch (error: any) {
    console.error('Error in getChamberInfo:', error);
    throw new Error(`Get chamber info failed: ${error.message}`);
  }
}
