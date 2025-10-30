import {
  getWithdrawQueueNFTContract,
  getUnderlyingTokenName,
} from '../../lib/utils/contracts.js';
import { ClaimSchema } from '../../schemas/index.js';
import { onchainWrite } from '@kasarlabs/ask-starknet-core';

export const claim = async (env: onchainWrite, params: ClaimSchema) => {
  try {
    const account = env.account;
    const withdrawQueueContract = getWithdrawQueueNFTContract(
      env.provider,
      params.token_type
    );
    const underlyingTokenName = getUnderlyingTokenName(params.token_type);

    // Convert request_id string to u128
    const requestId = BigInt(params.withdraw_request_id);

    withdrawQueueContract.connect(account);
    const claimCalldata = withdrawQueueContract.populate('claim_withdrawal', [
      requestId,
    ]);

    const { transaction_hash } = await account.execute([claimCalldata]);

    const receipt = await account.waitForTransaction(transaction_hash);
    if (!receipt.isSuccess()) {
      throw new Error('Transaction confirmed but failed');
    }

    return {
      status: 'success',
      data: {
        token_type: params.token_type,
        transaction_hash: transaction_hash,
        withdraw_request_id: params.withdraw_request_id,
        underlying_token: underlyingTokenName,
        message: `${underlyingTokenName} successfully claimed from withdraw request`,
      },
    };
  } catch (error: any) {
    return {
      status: 'failure',
      error: error.message || 'Unknown error claiming unstake request',
    };
  }
};
