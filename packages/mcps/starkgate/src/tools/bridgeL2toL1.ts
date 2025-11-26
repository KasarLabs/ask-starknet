import * as ethers from 'ethers';
import { STARKNET_BRIDGE_ADDRESS_MAP } from '../constants/contract-address.js';
import { BridgeL2toL1Params } from '../schemas/bridgeSchemas.js';
import { onchainWrite, ethTokenAddresses } from '@kasarlabs/ask-starknet-core';
import { Contract } from 'starknet';
import { L2_BRIDGE_ABI_MAP } from '../abi/l2bridge/bridge-map.js';

/**
 * Withdraw funds from Starknet (L2) to Ethereum (L1)
 * @param starknetEnv - Starknet write environment from env
 * @param params - Bridge parameters (toAddress, amount, symbol)
 * @returns Promise with withdrawal details
 */
export async function withdrawToEthereum(
  starknetEnv: onchainWrite,
  params: BridgeL2toL1Params
) {
  try {
    const { toAddress, amount, symbol } = params;
    const { provider, account } = starknetEnv;

    // Get the bridge address for the specified token
    const bridgeAddress = STARKNET_BRIDGE_ADDRESS_MAP[symbol];
    if (!bridgeAddress) {
      throw new Error(`Unsupported token: ${symbol}`);
    }

    console.error(`Using ${symbol} bridge: ${bridgeAddress}`);

    const withdrawContract = new Contract({
      address: bridgeAddress,
      abi: L2_BRIDGE_ABI_MAP[symbol],
      providerOrAccount: account,
    });

    let withdrawAmount: bigint;
    let withdrawTx;

    // Check if withdrawing ETH or ERC20 token
    if (symbol === 'ETH') {
      // For ETH: amount is in ether (18 decimals)
      const weiWithdrawAmount = ethers.parseEther(amount);
      withdrawAmount = BigInt(weiWithdrawAmount.toString());

      console.error(
        `Withdrawing ${amount} ETH (${withdrawAmount.toString()} wei) from Starknet address ${account.address} to Ethereum address ${toAddress}`
      );

      // Use initiate_withdraw for native ETH: initiate_withdraw(l1_recipient, amount)
      console.error('Using initiate_withdraw for native ETH');
      withdrawTx = await withdrawContract.initiate_withdraw(
        toAddress,
        withdrawAmount
      );
    } else {
      // For ERC20 tokens: parse amount based on token decimals
      // USDC and USDT use 6 decimals, others use 18
      const decimals = ['USDC', 'USDT'].includes(symbol) ? 6 : 18;
      const tokenAmount = ethers.parseUnits(amount, decimals);
      withdrawAmount = BigInt(tokenAmount.toString());

      console.error(`Token amount (${symbol}):`, withdrawAmount.toString());
      console.error(`Token decimals: ${decimals}`);
      console.error(
        `Withdrawing ${amount} ${symbol} from Starknet address ${account.address} to Ethereum address ${toAddress}`
      );

      // Get L1 token address
      const l1TokenAddress = ethTokenAddresses[symbol];
      if (!l1TokenAddress) {
        throw new Error(`L1 token address not found for ${symbol}`);
      }

      // Use initiate_token_withdraw for ERC20: initiate_token_withdraw(l1_token, l1_recipient, amount)
      console.error('Using initiate_token_withdraw for ERC20 token');
      withdrawTx = await withdrawContract.initiate_token_withdraw(
        l1TokenAddress,
        toAddress,
        withdrawAmount
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
      symbol,
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
  const result = await withdrawToEthereum(starknetEnv, params);
  console.error('Bridging completed.');
  return result;
}
