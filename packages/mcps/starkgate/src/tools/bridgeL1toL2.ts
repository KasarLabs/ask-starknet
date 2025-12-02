import * as ethers from 'ethers';
import { BridgeL1toL2Params } from '../schemas/index.js';
import { bitcoinWrite, ethereumWrite, solanaWrite } from '../lib/utils.js';
import { ethTokenAddresses, toolResult } from '@kasarlabs/ask-starknet-core';
import { ETHEREUM_BRIDGE_ADDRESS_MAP } from '../constants/contract-address.js';
import { L1_BRIDGE_ABI_MAP } from '../abi/l1bridge/bridge-map.js';

/**
 * Check and approve ERC20 token allowance for the bridge
 * @param tokenContract - ERC20 token contract instance
 * @param walletAddress - Wallet address
 * @param bridgeAddress - Bridge contract address
 * @param tokenAmount - Amount to approve
 * @param decimals - Token decimals
 * @param symbol - Token symbol
 */
async function ensureTokenAllowance(
  tokenContract: ethers.Contract,
  walletAddress: string,
  bridgeAddress: string,
  tokenAmount: bigint,
  decimals: number,
  symbol: string
): Promise<void> {
  // Check current allowance
  const currentAllowance = await tokenContract.allowance(
    walletAddress,
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
    const approveTx = await tokenContract.approve(bridgeAddress, tokenAmount);
    console.error('Approval transaction hash:', approveTx.hash);
    await approveTx.wait();
    console.error('Approval confirmed.');
  } else {
    console.error('Sufficient allowance already exists, skipping approval.');
  }
}

/**
 * Validate token balance is sufficient
 * @param tokenContract - ERC20 token contract instance
 * @param walletAddress - Wallet address
 * @param tokenAmount - Required token amount
 * @param decimals - Token decimals
 * @param symbol - Token symbol
 */
async function validateTokenBalance(
  tokenContract: ethers.Contract,
  walletAddress: string,
  tokenAmount: bigint,
  decimals: number,
  symbol: string
): Promise<void> {
  const tokenBalance = await tokenContract.balanceOf(walletAddress);
  console.error(
    `Token balance: ${ethers.formatUnits(tokenBalance, decimals)} ${symbol}`
  );

  if (tokenBalance < tokenAmount) {
    throw new Error(
      `Insufficient ${symbol} balance. Required: ${ethers.formatUnits(tokenAmount, decimals)} ${symbol}, Available: ${ethers.formatUnits(tokenBalance, decimals)} ${symbol}`
    );
  }
}

/**
 * Bridge funds from L1 (Ethereum) to L2 (Starknet)
 * @param ethEnv - Ethereum write environment with provider and wallet from env
 * @param params - Bridge parameters (toAddress, amount, symbol)
 * @returns Promise with transaction details
 */
export async function depositFromEthToStarknet(
  ethEnv: ethereumWrite,
  params: BridgeL1toL2Params
): Promise<toolResult> {
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

    // For ERC20 tokens: fetch decimals from the Ethereum token contract
    const l1TokenAddress = ethTokenAddresses[symbol];
    if (!l1TokenAddress) {
      throw new Error(`Ethereum token address not found for ${symbol}`);
    }

    const tokenContract = new ethers.Contract(
      l1TokenAddress,
      ['function decimals() view returns (uint8)'],
      provider
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
      let decimals = 18; // Default
      try {
        // Fetch decimals from the Ethereum token contract
        const fetchedDecimals = await tokenContract.decimals();
        decimals = Number(fetchedDecimals);
        console.error(`Fetched decimals for ${symbol}: ${decimals}`);
      } catch (error) {
        console.error(
          `Failed to fetch decimals for ${symbol}, using default (18):`,
          error
        );
      }
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

      // Validate token balance
      await validateTokenBalance(
        tokenContract,
        wallet.address,
        tokenAmount,
        decimals,
        symbol
      );

      // Ensure token allowance for bridge
      await ensureTokenAllowance(
        tokenContract,
        wallet.address,
        bridgeAddress,
        tokenAmount,
        decimals,
        symbol
      );

      // Use the ERC20 deposit function: deposit(address token, uint256 amount, uint256 l2Recipient)
      depositTx = await bridgeContract['deposit(address,uint256,uint256)'](
        l1TokenAddress,
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
      data: {
        transactionHash: depositTx.hash,
        amount,
        symbol,
        from: wallet.address,
        to: toAddress,
      },
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
): Promise<toolResult> {
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
