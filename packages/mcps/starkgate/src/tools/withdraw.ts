import { z } from 'zod';
import { Contract, Account, uint256 } from 'starknet';
import { onchainWrite } from '@kasarlabs/ask-starknet-core';
import { withdrawSchema } from '../schemas/index.js';
import { WithdrawResult } from '../lib/types/index.js';
import {
  getBridgeAddresses,
  parseAmount,
  addressToUint256,
  getTokenDecimals,
  isValidEthAddress,
} from '../lib/utils/index.js';
import { STARKGATE_L2_ABI } from '../lib/abis/starkgateL2.js';

/**
 * Initiate withdrawal of tokens from Starknet L2 to Ethereum L1
 * @param env - Onchain write environment
 * @param params - Withdraw parameters
 * @returns {Promise<string>} JSON string with withdrawal result
 */
export const withdraw = async (
  env: onchainWrite,
  params: z.infer<typeof withdrawSchema>
): Promise<string> => {
  try {
    const { token, amount, l1RecipientAddress, network } = params;

    // Validate L1 recipient address
    if (!isValidEthAddress(l1RecipientAddress)) {
      throw new Error(`Invalid Ethereum address: ${l1RecipientAddress}`);
    }

    const provider = env.provider;
    const account = env.account;

    // Get bridge addresses
    const addresses = getBridgeAddresses(token, network);
    const decimals = getTokenDecimals(token);
    const amountWei = parseAmount(amount, decimals);

    // Convert to Starknet Uint256 format
    const amountUint256 = uint256.bnToUint256(amountWei);

    // Convert L1 recipient to felt (uint256 for cairo)
    const l1RecipientFelt = addressToUint256(l1RecipientAddress);

    // Create contract instance
    const bridgeContract = new Contract(
      STARKGATE_L2_ABI,
      addresses.L2_BRIDGE,
      provider
    );
    bridgeContract.connect(account);

    // Call initiate_token_withdraw
    const call = bridgeContract.populate('initiate_token_withdraw', [
      addresses.L1_TOKEN, // l1_token
      l1RecipientFelt, // l1_recipient
      amountUint256, // amount
    ]);

    // Execute transaction
    const tx = await account.execute(call);
    await provider.waitForTransaction(tx.transaction_hash);

    const result: WithdrawResult = {
      status: 'success',
      token,
      amount,
      l2_tx_hash: tx.transaction_hash,
      l1_recipient: l1RecipientAddress,
      message:
        'Withdrawal initiated on L2. Wait for the block to be proven on L1 (~few hours), then claim on L1 via Starkgate UI.',
    };

    return JSON.stringify(result);
  } catch (error) {
    const result: WithdrawResult = {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
      step: 'withdraw execution',
    };
    return JSON.stringify(result);
  }
};
