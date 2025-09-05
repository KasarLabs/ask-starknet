import { Account, constants, Contract } from 'starknet';
import { SnakAgentInterface } from '../dependances/types.js';
import {
  validateAndFormatParams,
  executeV3Transaction,
  validateToken,
  detectAbiType,
  extractAssetInfo,
} from '../utils/utils.js';
import { z } from 'zod';
import { transferSchema, transferSignatureSchema } from '../schemas/schema.js';
import { TransferResult } from '../types/types.js';
import { validToken } from '../types/types.js';
import { RpcProvider } from 'starknet';

/**
 * Transfers ERC20 tokens on Starknet
 * @param {SnakAgentInterface} agent - The Starknet agent interface
 * @param {TransferParams} params - Transfer parameters
 * @returns {Promise<string>} JSON string with transaction result
 * @throws {Error} If transfer fails
 */
export const transfer = async (
  agent: SnakAgentInterface,
  params: z.infer<typeof transferSchema>
): Promise<string> => {
  try {
    const provider = agent.getProvider();
    const credentials = agent.getAccountCredentials();

    const { assetSymbol, assetAddress } = extractAssetInfo(params.asset);

    const token: validToken = await validateToken(
      provider,
      assetSymbol,
      assetAddress
    );
    const abi = await detectAbiType(token.address, provider);
    const { address, amount } = validateAndFormatParams(
      params.recipientAddress,
      params.amount,
      token.decimals
    );

    const recipientAddress = address;

    const account = new Account(
      provider,
      credentials.accountPublicKey, // This is actually the account address, not public key
      credentials.accountPrivateKey,
      undefined,
      constants.TRANSACTION_VERSION.V3
    );

    // Check if account exists, if not throw a clearer error
    try {
      const nonce = await account.getNonce();
      console.log(`Account nonce: ${nonce}`);
    } catch (error) {
      throw new Error(
        `Account not found on this network. Please verify your account address and network. Account: ${credentials.accountPublicKey}. Error: ${error.message}`
      );
    }

    const contract = new Contract(abi, token.address, provider);
    contract.connect(account);

    const calldata = contract.populate('transfer', {
      recipient: recipientAddress,
      amount: amount,
    });

    const txH = await executeV3Transaction({
      call: calldata,
      account: account,
    });

    return JSON.stringify({
      status: 'success',
      amount: params.amount,
      symbol: token.symbol,
      recipients_address: recipientAddress,
      transaction_hash: txH,
    });
  } catch (error) {
    const transferResult: TransferResult = {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
      step: 'transfer execution',
    };
    return JSON.stringify(transferResult);
  }
};
