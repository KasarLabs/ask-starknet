import { z } from 'zod';
import { Contract, Wallet, JsonRpcProvider } from 'ethers';
import { depositSchema } from '../schemas/index.js';
import { DepositResult } from '../lib/types/index.js';
import {
  getBridgeAddresses,
  parseAmount,
  feltToUint256,
  getTokenDecimals,
  isValidStarknetAddress,
} from '../lib/utils/index.js';
import { STARKGATE_L1_ABI, ERC20_ABI } from '../lib/abis/starkgateL1.js';

/**
 * Deposit tokens from Ethereum L1 to Starknet L2
 * @param params - Deposit parameters
 * @returns {Promise<string>} JSON string with deposit result
 */
export const deposit = async (
  params: z.infer<typeof depositSchema>
): Promise<string> => {
  try {
    const { token, amount, l2RecipientAddress, network } = params;

    // Validate L2 recipient address
    if (!isValidStarknetAddress(l2RecipientAddress)) {
      throw new Error(`Invalid Starknet address: ${l2RecipientAddress}`);
    }

    // Get required environment variables
    const privateKey = process.env.ETHEREUM_PRIVATE_KEY;
    const rpcUrl = process.env.ETHEREUM_RPC_URL;

    if (!privateKey || !rpcUrl) {
      throw new Error(
        'Missing required environment variables: ETHEREUM_PRIVATE_KEY, ETHEREUM_RPC_URL'
      );
    }

    // Setup L1 provider and signer
    const provider = new JsonRpcProvider(rpcUrl);
    const wallet = new Wallet(privateKey, provider);

    // Get bridge addresses
    const addresses = getBridgeAddresses(token, network);
    const decimals = getTokenDecimals(token);
    const amountWei = parseAmount(amount, decimals);

    // Convert L2 recipient to uint256
    const l2RecipientUint256 = feltToUint256(l2RecipientAddress);

    let txHash: string;

    if (token === 'ETH') {
      // For ETH: direct deposit with value
      const bridgeContract = new Contract(
        addresses.L1_BRIDGE,
        STARKGATE_L1_ABI,
        wallet
      );

      const tx = await bridgeContract.deposit(amountWei, l2RecipientUint256, {
        value: amountWei,
      });

      const receipt = await tx.wait();
      txHash = receipt.hash;
    } else {
      // For ERC20 (USDC): approve then deposit
      const tokenContract = new Contract(
        addresses.L1_TOKEN,
        ERC20_ABI,
        wallet
      );

      // Check allowance
      const currentAllowance = await tokenContract.allowance(
        wallet.address,
        addresses.L1_BRIDGE
      );

      // Approve if needed
      if (currentAllowance < amountWei) {
        const approveTx = await tokenContract.approve(
          addresses.L1_BRIDGE,
          amountWei
        );
        await approveTx.wait();
      }

      // Deposit
      const bridgeContract = new Contract(
        addresses.L1_BRIDGE,
        STARKGATE_L1_ABI,
        wallet
      );

      const tx = await bridgeContract.deposit(amountWei, l2RecipientUint256);
      const receipt = await tx.wait();
      txHash = receipt.hash;
    }

    const result: DepositResult = {
      status: 'success',
      token,
      amount,
      l1_tx_hash: txHash,
      l2_recipient: l2RecipientAddress,
      estimated_l2_arrival: '10-15 minutes',
    };

    return JSON.stringify(result);
  } catch (error) {
    const result: DepositResult = {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
      step: 'deposit execution',
    };
    return JSON.stringify(result);
  }
};
