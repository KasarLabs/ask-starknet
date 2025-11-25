import * as ethers from 'ethers';
import { BRIDGE_STRK_TO_ETH_ABI } from '@/abi/bridge-starknet.abi.js';
import { BRIDGE_STARKNET_TO_ETH_ADDRESS } from '@/constants/contract-address.js';
import { BridgeL2toL1Params } from '@/schemas/bridgeSchemas.js';
import { onchainWrite } from '@kasarlabs/ask-starknet-core';
import { Contract } from 'starknet';

/**
 * Withdraw STRK to Ethereum
 * @param starknetEnv - Starknet write environment from env
 * @param params - Bridge parameters
 * @returns Promise with withdrawal details
 */
export async function withdrawSTRKtoEthereum(
  starknetEnv: onchainWrite,
  params: BridgeL2toL1Params
) {
  try {
    const { toAddress, amount, tokenAddress } = params;
    const { provider, account } = starknetEnv;

    // Convert amount to wei using ethers, then to BigInt for Starknet
    const weiWithdrawAmount = ethers.parseEther(amount);
    const weiAmountBigInt = BigInt(weiWithdrawAmount.toString());

    console.error(
      `Withdrawing ${amount} ETH (${weiAmountBigInt.toString()} wei) from Starknet address ${account.address} to ethereum address ${toAddress}`
    );

    const withdrawContract = new Contract({
      abi: BRIDGE_STRK_TO_ETH_ABI,
      address: BRIDGE_STARKNET_TO_ETH_ADDRESS,
      providerOrAccount: account,
    });

    // Format parameters according to Cairo ABI
    // EthAddress: pass as a felt252 (the address string will be converted by starknet.js)
    // u256: pass as a BigInt or number, starknet.js will handle the conversion to u256 struct
    let withdrawTx;
    if (tokenAddress) {
      withdrawTx = await withdrawContract.initiate_token_withdraw(
        tokenAddress,
        toAddress,
        weiAmountBigInt
      );
    } else {
      withdrawTx = await withdrawContract.initiate_withdraw(
        toAddress,
        weiAmountBigInt
      );
    }

    console.error('Withdraw transaction hash:', withdrawTx.transaction_hash);

    // Wait for transaction confirmation
    const receipt = await provider.waitForTransaction(
      withdrawTx.transaction_hash
    );
    console.error('Withdraw transaction confirmed on L2.', receipt);

    return {
      status: 'success',
      transactionHash: withdrawTx.transaction_hash,
      amount,
      from: account.address,
      to: toAddress,
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Bridge funds from L2 to L1
 * @param starknetEnv - Starknet write environment from env
 * @param params - Bridge parameters
 * @returns Promise with operation result
 */
export async function bridgeL2toL1(
  starknetEnv: onchainWrite,
  params: BridgeL2toL1Params
) {
  console.error('Bridging from Starknet to Ethereum...');
  const result = await withdrawSTRKtoEthereum(starknetEnv, params);
  console.error('Bridging completed.');
  return result;
}
