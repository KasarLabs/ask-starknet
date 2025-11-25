import * as ethers from 'ethers';
import { BridgeL1toL2Params } from '../schemas/index.js';
import { bitcoinWrite, ethereumWrite, solanaWrite } from '../lib/utils.js';
import { BRIDGE_ETHEREUM_TO_STARKNET_ABI } from '../abi/bridge-ethereum.abi.js';
import { BRIDGE_ETHEREUM_TO_STARKNET_ADDRESS } from '../constants/contract-address.js';

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
    const { toAddress, amount, tokenAddress, message } = params;
    const { wallet } = ethEnv;

    const weiAmount = ethers.parseEther(amount);
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
      const contract = (depositTx = await bridgeContract[
        'depositERC20(address,uint256,uint256)'
      ](tokenAddress, weiAmount, toAddress, {
        value: estimateDepositFeeWei,
      }));
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
      from: wallet.address,
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
  console.error('Starting L1 to L2 bridge operation...');
  console.error(JSON.stringify(params, null, 2));
  const result = await depositFromEthToStarknet(
    ethEnv as ethereumWrite,
    params
  );
  await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait for 3 seconds
  console.error('Bridging completed.');
  return result;
}
