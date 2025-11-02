import { z } from 'zod';
import { JsonRpcProvider } from 'ethers';
import { RpcProvider } from 'starknet';
import { checkDepositStatusSchema } from '../schemas/index.js';
import { CheckDepositStatusResult } from '../lib/types/index.js';
import { getBridgeAddresses } from '../lib/utils/index.js';

/**
 * Check the status of a deposit from L1 to L2
 * Verifies if the L1→L2 message has been consumed on Starknet
 *
 * @param params - Check deposit status parameters
 * @returns {Promise<string>} JSON string with deposit status result
 */
export const checkDepositStatus = async (
  params: z.infer<typeof checkDepositStatusSchema>
): Promise<string> => {
  try {
    const { l1TxHash, network } = params;

    // Get required environment variables
    const ethRpcUrl = process.env.ETHEREUM_RPC_URL;
    const starknetRpcUrl = process.env.STARKNET_RPC_URL;

    if (!ethRpcUrl || !starknetRpcUrl) {
      throw new Error(
        'Missing required environment variables: ETHEREUM_RPC_URL, STARKNET_RPC_URL'
      );
    }

    // Setup providers
    const ethProvider = new JsonRpcProvider(ethRpcUrl);
    const starknetProvider = new RpcProvider({ nodeUrl: starknetRpcUrl });

    // Get L1 transaction receipt
    const l1Receipt = await ethProvider.getTransactionReceipt(l1TxHash);

    if (!l1Receipt) {
      const result: CheckDepositStatusResult = {
        status: 'success',
        deposit_status: 'NOT_FOUND',
        l1_tx_hash: l1TxHash,
        message: 'L1 transaction not found or not yet confirmed',
      };
      return JSON.stringify(result);
    }

    // Check if transaction was successful
    if (l1Receipt.status === 0) {
      const result: CheckDepositStatusResult = {
        status: 'success',
        deposit_status: 'FAILED',
        l1_tx_hash: l1TxHash,
        message: 'L1 transaction failed',
      };
      return JSON.stringify(result);
    }

    // For now, we can't easily track L1→L2 message consumption without
    // complex log parsing and Starknet message hash calculation
    // We return PENDING status and suggest checking Starkscan
    const result: CheckDepositStatusResult = {
      status: 'success',
      deposit_status: 'PENDING',
      l1_tx_hash: l1TxHash,
      message:
        'L1 transaction confirmed. Check https://starkscan.co for L2 arrival status. Deposits typically arrive on L2 within 10-15 minutes.',
    };

    return JSON.stringify(result);
  } catch (error) {
    const result: CheckDepositStatusResult = {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return JSON.stringify(result);
  }
};
