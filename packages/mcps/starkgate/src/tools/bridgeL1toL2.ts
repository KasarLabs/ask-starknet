import * as ethers from 'ethers';
import { BridgeL1toL2Params } from '../schemas/index.js';
import { bitcoinWrite, ethereumWrite, solanaWrite } from '../lib/utils.js';
import { ethTokenAddresses } from '@kasarlabs/ask-starknet-core';
import { ETHEREUM_BRIDGE_ADDRESS_MAP } from '../constants/contract-address.js';
import { L1_BRIDGE_ABI_MAP } from '../abi/l1bridge/bridge-map.js';

/**
 * Bridge funds from L1 (Ethereum) to L2 (Starknet)
 * @param ethEnv - Ethereum write environment with provider and wallet from env
 * @param params - Bridge parameters (toAddress, amount, symbol)
 * @returns Promise with transaction details
 */
export async function depositFromEthToStarknet(
  ethEnv: ethereumWrite,
  params: BridgeL1toL2Params
) {
  try {
    const { toAddress, amount, symbol } = params;
    const { wallet, provider } = ethEnv;

    // Get the bridge address for the specified token
    const bridgeAddress = ETHEREUM_BRIDGE_ADDRESS_MAP[symbol];
    if (!bridgeAddress) {
      throw new Error(`Unsupported token: ${symbol}`);
    }

    console.error(`Using ${symbol} bridge: ${bridgeAddress}`);

    // Create bridge contract instance
    const bridgeContract = new ethers.Contract(
      bridgeAddress,
      L1_BRIDGE_ABI_MAP[symbol],
      wallet
    );

    // Get the deposit fee
    const estimateDepositFeeWei = await bridgeContract.estimateDepositFeeWei();
    console.error(
      'Estimated deposit fee (wei):',
      estimateDepositFeeWei.toString()
    );

    let depositTx;
    let totalValue = estimateDepositFeeWei;
    let tokenAmount: bigint;

    if (symbol === 'ETH') {
      tokenAmount = ethers.parseEther(amount);

      // For ETH, value = amount + fees
      totalValue = tokenAmount + estimateDepositFeeWei;

      console.error('Total transaction value (wei):', totalValue.toString());
      console.error(
        `Depositing ${amount} ${symbol} to Starknet address ${toAddress} from Ethereum address ${wallet.address}`
      );

      depositTx = await bridgeContract['deposit(uint256,uint256)'](
        tokenAmount,
        toAddress,
        {
          value: totalValue,
        }
      );
    } else {
      // For ERC20 tokens: parse amount based on token decimals
      // USDC and USDT use 6 decimals, others use 18
      const decimals = ['USDC', 'USDT'].includes(symbol) ? 6 : 18;
      tokenAmount = ethers.parseUnits(amount, decimals);

      console.error(`Token amount (${symbol}):`, tokenAmount.toString());
      console.error(`Token decimals: ${decimals}`);
      console.error('Deposit fee (wei):', estimateDepositFeeWei.toString());
      console.error(
        `Depositing ${amount} ${symbol} to Starknet address ${toAddress} from Ethereum address ${wallet.address}`
      );

      // Check ETH balance for fees
      const ethBalance = await provider.getBalance(wallet.address);
      if (ethBalance < estimateDepositFeeWei) {
        throw new Error(
          `Insufficient ETH for fees. Required: ${ethers.formatEther(estimateDepositFeeWei)} ETH, Available: ${ethers.formatEther(ethBalance)} ETH`
        );
      }

      const tokenAddress = ethTokenAddresses[symbol];
      if (!tokenAddress) {
        throw new Error(`Token address not found for ${symbol}`);
      }

      // Check token balance
      const tokenContract = new ethers.Contract(
        tokenAddress,
        [
          'function balanceOf(address) view returns (uint256)',
          'function approve(address,uint256) returns (bool)',
          'function allowance(address,address) view returns (uint256)',
        ],
        wallet
      );

      const tokenBalance = await tokenContract.balanceOf(wallet.address);
      console.error(
        `Token balance: ${ethers.formatUnits(tokenBalance, decimals)} ${symbol}`
      );

      if (tokenBalance < tokenAmount) {
        throw new Error(
          `Insufficient ${symbol} balance. Required: ${ethers.formatUnits(tokenAmount, decimals)} ${symbol}, Available: ${ethers.formatUnits(tokenBalance, decimals)} ${symbol}`
        );
      }

      // Check current allowance
      const currentAllowance = await tokenContract.allowance(
        wallet.address,
        bridgeAddress
      );
      console.error(
        `Current allowance: ${ethers.formatUnits(currentAllowance, decimals)} ${symbol}`
      );

      // If allowance is insufficient, approve the bridge
      if (currentAllowance < tokenAmount) {
        console.error(
          `Approving bridge to spend ${ethers.formatUnits(tokenAmount, decimals)} ${symbol}...`
        );
        const approveTx = await tokenContract.approve(
          bridgeAddress,
          tokenAmount
        );
        console.error('Approval transaction hash:', approveTx.hash);
        await approveTx.wait();
        console.error('Approval confirmed.');
      } else {
        console.error(
          'Sufficient allowance already exists, skipping approval.'
        );
      }

      // Use the ERC20 deposit function: deposit(address token, uint256 amount, uint256 l2Recipient)
      depositTx = await bridgeContract['deposit(address,uint256,uint256)'](
        tokenAddress,
        tokenAmount,
        toAddress,
        {
          value: estimateDepositFeeWei,
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
      symbol,
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
