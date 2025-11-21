import { onchainWrite } from '@kasarlabs/ask-starknet-core';
import * as ethers from 'ethers';
import { Contract } from 'starknet';
import { BridgeL1toL2Params, BridgeL2toL1Params } from '../schemas/index.js';
import { bitcoinWrite, ethereumWrite, solanaWrite } from '../lib/utils.js';
import { BRIDGE_ETHEREUM_TO_STARKNET_ABI } from '../abi/bridge-ethereum.abi.js';
import { BRIDGE_STRK_TO_ETH_ABI } from '../abi/bridge-STRK-to-ETH.abi.js';
import {
  BRIDGE_ETHEREUM_TO_STARKNET_ADDRESS,
  BRIDGE_STARKNET_TO_ETH_ADDRESS,
} from '../constants/contract-address.js';
import { HyperlaneCore, MultiProvider } from '@hyperlane-xyz/sdk';

/**
 * Bridge ETH from L1 (Ethereum) to L2 (Starknet)
 * @param ethEnv - Ethereum write environment with provider and wallet from env
 * @param params - Bridge parameters (l1chain, toAddress, amount)
 * @returns Promise with transaction details
 */
export async function depositFromEthToStarknet(
  ethEnv: ethereumWrite,
  params: BridgeL1toL2Params
) {
  try {
    const { l1chain, toAddress, amount, tokenAddress } = params;
    const { provider, wallet } = ethEnv;

    const weiAmount = ethers.parseEther(amount);
    console.error(
      `Bridging ${amount} (${weiAmount.toString()} wei) from ${l1chain} to Starknet address ${toAddress}`
    );

    const bridgeContract = new ethers.Contract(
      BRIDGE_ETHEREUM_TO_STARKNET_ADDRESS,
      BRIDGE_ETHEREUM_TO_STARKNET_ABI,
      wallet
    );

    const estimateDepositFeeWei = await bridgeContract.estimateDepositFeeWei();
    console.error(
      'Estimated deposit fee (wei):',
      estimateDepositFeeWei.toString()
    );

    // Total value to send = amount to bridge + deposit fee
    const totalValue = weiAmount + estimateDepositFeeWei;
    console.error('Total transaction value (wei):', totalValue.toString());
    let depositTx;
    if (tokenAddress) {
      depositTx = await bridgeContract['depositERC20(address,uint256,uint256)'](
        tokenAddress,
        weiAmount,
        toAddress,
        {
          value: estimateDepositFeeWei,
        }
      );
    } else {
      // Use the specific deposit function signature for ETH: deposit(uint256 amount, uint256 l2Recipient)
      depositTx = await bridgeContract['deposit(uint256,uint256)'](
        weiAmount,
        toAddress,
        {
          value: totalValue,
        }
      );
    }

    console.error('Deposit transaction hash:', depositTx.hash);

    await depositTx.wait();
    console.error('Deposit transaction confirmed on L1.');

    return {
      status: 'success',
      transactionHash: depositTx.hash,
      amount,
      from: l1chain,
      to: toAddress,
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export function depositFromSolanaToStarknet() {
  throw new Error('Solana to Starknet bridging not implemented yet.');
}

// export function depositFromBitcoinToStarknet(
//   solanaEnv: solanaWrite,
//   params: BridgeL1toL2Params
// ) {
//   // Initialize Hyperlane
//   const multiProvider = new MultiProvider({
//     solana : {
//       rpcUrls
//     }
//   });
//   const core = HyperlaneCore.fromAddressesMap(multiProvider, {});

//   // Send message from Solana to Starknet
//   const message = {
//     destinationDomain: 23295, // Starknet domain ID
//     recipientAddress:
//       '0x05ee6b7cba621eb61668312cc13a298bbe99a69d42bc80df9829cfe7674ae0eb',
//     messageBody: '0x...', // Encoded transfer data
//   };

//   const txHash = await core.sendMessage(message);
//   console.log('Transaction:', txHash);
// }

/**
 * Bridge funds from L1 to L2
 * @param ethEnv - Ethereum write environment from env
 * @param params - Bridge parameters
 * @returns Promise with operation result
 */
export async function bridgeL1toL2(
  ethEnv: ethereumWrite | bitcoinWrite | solanaWrite,
  params: BridgeL1toL2Params
) {
  const { l1chain } = params;
  console.error('Starting L1 to L2 bridge operation...');
  console.error(JSON.stringify(params, null, 2));
  switch (l1chain) {
    case 'ethereum':
      console.error('Bridging from Ethereum to Starknet...');
      const result = await depositFromEthToStarknet(
        ethEnv as ethereumWrite,
        params
      );
      await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait for 3 seconds
      console.error('Bridging completed.');
      return result;
    case 'solana':
      throw new Error('Solana to Starknet bridging not implemented yet.');
    case 'bitcoin':
      throw new Error('Bitcoin to Starknet bridging not implemented yet.');
    default:
      throw new Error(`Unsupported L1 chain: ${l1chain}`);
  }
}

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
    const { l1chain, toAddress, amount, tokenAddress } = params;
    const { provider, account } = starknetEnv;

    // Convert amount to wei using ethers, then to BigInt for Starknet
    const weiWithdrawAmount = ethers.parseEther(amount);
    const weiAmountBigInt = BigInt(weiWithdrawAmount.toString());

    console.error(
      `Withdrawing ${amount} ETH (${weiAmountBigInt.toString()} wei) from Starknet address ${account.address} to ${l1chain} address ${toAddress}`
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
  const { l1chain } = params;

  switch (l1chain) {
    case 'ethereum':
      console.error('Bridging from Starknet to Ethereum...');
      const result = await withdrawSTRKtoEthereum(starknetEnv, params);
      console.error('Bridging completed.');
      return result;
    case 'solana':
      throw new Error('Solana to Starknet bridging not implemented yet.');
    case 'bitcoin':
      throw new Error('Bitcoin to Starknet bridging not implemented yet.');

    default:
      throw new Error(`Unsupported L1 chain: ${l1chain}`);
  }
}
