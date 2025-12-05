import * as ethers from 'ethers';
import { STARKNET_BRIDGE_ADDRESS_MAP } from '../constants/contract-address.js';
import { BridgeL2toL1Params } from '../schemas/bridgeSchemas.js';
import {
  onchainWrite,
  ethTokenAddresses,
  starknetTokenAddresses,
  getStarknetTokenAbi,
  type StarknetTokenSymbol,
  toolResult,
} from '@kasarlabs/ask-starknet-core';
import { Contract } from 'starknet';
import { L2_BRIDGE_ABI_MAP } from '../abi/l2bridge/bridge-map.js';

/**
 * Validate token balance is sufficient on Starknet
 * @param tokenContract - Starknet token contract instance
 * @param accountAddress - Account address
 * @param tokenAmount - Required token amount
 * @param decimals - Token decimals
 * @param symbol - Token symbol
 */
async function validateStarknetTokenBalance(
  tokenContract: Contract,
  accountAddress: string,
  tokenAmount: bigint,
  decimals: number,
  symbol: string
): Promise<void> {
  const balance = await tokenContract.balanceOf(accountAddress);
  const tokenBalance = BigInt(balance.toString());

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
 * Check and approve token allowance for the bridge on Starknet
 * @param tokenContract - Starknet token contract instance
 * @param accountAddress - Account address
 * @param bridgeAddress - Bridge contract address
 * @param tokenAmount - Amount to approve
 * @param decimals - Token decimals
 * @param symbol - Token symbol
 */
async function ensureStarknetTokenAllowance(
  tokenContract: Contract,
  accountAddress: string,
  bridgeAddress: string,
  tokenAmount: bigint,
  decimals: number,
  symbol: string
): Promise<void> {
  // Check current allowance
  const allowance = await tokenContract.allowance(
    accountAddress,
    bridgeAddress
  );
  const currentAllowance = BigInt(allowance.toString());

  console.error(
    `Current allowance: ${ethers.formatUnits(currentAllowance, decimals)} ${symbol}`
  );

  // If allowance is insufficient, approve the bridge
  if (currentAllowance < tokenAmount) {
    console.error(
      `Approving bridge to spend ${ethers.formatUnits(tokenAmount, decimals)} ${symbol}...`
    );
    const approveTx = await tokenContract.approve(bridgeAddress, tokenAmount);
    console.error('Approval transaction hash:', approveTx.transaction_hash);
    await tokenContract.providerOrAccount.waitForTransaction(
      approveTx.transaction_hash
    );
    console.error('Approval confirmed.');
  } else {
    console.error('Sufficient allowance already exists, skipping approval.');
  }
}

/**
 * Withdraw funds from Starknet (L2) to Ethereum (L1)
 * @param starknetEnv - Starknet write environment from env
 * @param params - Bridge parameters (toAddress, amount, symbol)
 * @returns Promise with withdrawal details
 */
export async function withdrawToEthereum(
  starknetEnv: onchainWrite,
  params: BridgeL2toL1Params
): Promise<toolResult> {
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

    let withdrawTx;

    if (symbol === 'ETH') {
      const weiWithdrawAmount = ethers.parseEther(amount);
      const withdrawAmount = BigInt(weiWithdrawAmount.toString());

      console.error(
        `Withdrawing ${amount} ETH (${withdrawAmount.toString()} wei) from Starknet address ${account.address} to Ethereum address ${toAddress}`
      );

      console.error('Using initiate_withdraw for native ETH');
      withdrawTx = await withdrawContract.initiate_withdraw(
        toAddress,
        withdrawAmount
      );
    } else {
      // For ERC20 tokens: Get token address and create contract
      const tokenAddress = starknetTokenAddresses[symbol];
      if (!tokenAddress) {
        throw new Error(`Starknet token address not found for ${symbol}`);
      }

      // Get token ABI and create contract instance
      const tokenAbi = getStarknetTokenAbi(symbol as StarknetTokenSymbol);
      const tokenContract = new Contract({
        abi: tokenAbi,
        address: tokenAddress,
        providerOrAccount: account,
      });

      // Fetch decimals from the token contract
      let decimals = 18; // Default
      try {
        const fetchedDecimals = await tokenContract.decimals();
        decimals = Number(fetchedDecimals);
        console.error(`Fetched decimals for ${symbol}: ${decimals}`);
      } catch (error) {
        console.error(
          `Failed to fetch decimals for ${symbol}, using default (18):`,
          error
        );
      }

      const tokenAmount = ethers.parseUnits(amount, decimals);
      const withdrawAmount = BigInt(tokenAmount.toString());

      console.error(`Token amount (${symbol}):`, withdrawAmount.toString());
      console.error(`Token decimals: ${decimals}`);
      console.error(
        `Withdrawing ${amount} ${symbol} from Starknet address ${account.address} to Ethereum address ${toAddress}`
      );

      // Validate token balance
      await validateStarknetTokenBalance(
        tokenContract,
        account.address,
        withdrawAmount,
        decimals,
        symbol
      );

      // Ensure token allowance for bridge
      await ensureStarknetTokenAllowance(
        tokenContract,
        account.address,
        bridgeAddress,
        withdrawAmount,
        decimals,
        symbol
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
      data: {
        transactionHash: withdrawTx.transaction_hash,
        amount,
        symbol,
        from: account.address,
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
 * Bridge funds from L2 to L1
 * @param starknetEnv - Starknet write environment from env
 * @param params - Bridge parameters
 * @returns Promise with operation result
 */
export async function bridgeL2toL1(
  starknetEnv: onchainWrite,
  params: BridgeL2toL1Params
): Promise<toolResult> {
  console.error('Bridging from Starknet to Ethereum...');
  const result = await withdrawToEthereum(starknetEnv, params);
  console.error('Bridging completed.');
  return result;
}
