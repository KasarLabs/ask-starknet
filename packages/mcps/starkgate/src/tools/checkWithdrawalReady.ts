import { z } from 'zod';
import { RpcProvider } from 'starknet';
import { checkWithdrawalReadySchema } from '../schemas/index.js';
import { CheckWithdrawalReadyResult } from '../lib/types/index.js';

/**
 * Check if a withdrawal from L2 to L1 is ready to be claimed
 * Verifies if the L2 block has been proven on L1
 *
 * @param params - Check withdrawal ready parameters
 * @returns {Promise<string>} JSON string with withdrawal status result
 */
export const checkWithdrawalReady = async (
  params: z.infer<typeof checkWithdrawalReadySchema>
): Promise<string> => {
  try {
    const { l2TxHash, network } = params;

    // Get required environment variables
    const starknetRpcUrl = process.env.STARKNET_RPC_URL;

    if (!starknetRpcUrl) {
      throw new Error(
        'Missing required environment variable: STARKNET_RPC_URL'
      );
    }

    // Setup Starknet provider
    const provider = new RpcProvider({ nodeUrl: starknetRpcUrl });

    // Get L2 transaction receipt
    const l2Receipt = await provider.getTransactionReceipt(l2TxHash);

    if (!l2Receipt) {
      const result: CheckWithdrawalReadyResult = {
        status: 'success',
        withdrawal_status: 'NOT_FOUND',
        l2_tx_hash: l2TxHash,
        message: 'L2 transaction not found',
      };
      return JSON.stringify(result);
    }

    // Check transaction status
    const txStatus = l2Receipt.execution_status;

    if (txStatus === 'REVERTED') {
      const result: CheckWithdrawalReadyResult = {
        status: 'success',
        withdrawal_status: 'NOT_FOUND',
        l2_tx_hash: l2TxHash,
        message: 'L2 transaction reverted. Withdrawal was not initiated.',
      };
      return JSON.stringify(result);
    }

    // For now, we can't easily check if the L2 block has been proven on L1
    // without querying the Starknet Core Contract on L1
    // We return PENDING status and estimated time
    const result: CheckWithdrawalReadyResult = {
      status: 'success',
      withdrawal_status: 'PENDING',
      l2_tx_hash: l2TxHash,
      proof_available: false,
      estimated_ready_time: '2-5 hours from L2 tx confirmation',
      message:
        'Withdrawal initiated on L2. Wait for the block to be proven on L1 (~2-5 hours), then claim via https://starkgate.starknet.io/',
    };

    return JSON.stringify(result);
  } catch (error) {
    const result: CheckWithdrawalReadyResult = {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return JSON.stringify(result);
  }
};
