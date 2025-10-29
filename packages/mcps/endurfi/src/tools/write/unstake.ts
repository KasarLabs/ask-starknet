import {
  getLiquidTokenContract,
  getWithdrawQueueNFTAddress,
  getTokenDecimals,
  getLiquidTokenName,
  getUnderlyingTokenName,
} from '../../lib/utils/contracts.js';
import { UnstakeSchema } from '../../schemas/index.js';
import { onchainWrite } from '@ijusttookadnatest/core';
import { formatUnits } from '../../lib/utils/formatting.js';
import { extractWithdrawRequestIdFromReceipt } from '../../lib/utils/events.js';

export const unstake = async (env: onchainWrite, params: UnstakeSchema) => {
  try {
    const account = env.account;
    const liquidTokenContract = getLiquidTokenContract(
      env.provider,
      params.token_type
    );
    const decimals = getTokenDecimals(params.token_type);
    const liquidTokenName = getLiquidTokenName(params.token_type);
    const underlyingTokenName = getUnderlyingTokenName(params.token_type);

    const shares = BigInt(params.amount);

    // Call redeem to create a withdraw request (NFT)
    liquidTokenContract.connect(account);
    const redeemCalldata = liquidTokenContract.populate('redeem', [
      shares,
      account.address,
      account.address,
    ]);

    const { transaction_hash } = await account.execute([redeemCalldata]);

    const receipt = await account.waitForTransaction(transaction_hash);
    if (!receipt.isSuccess()) {
      throw new Error('Transaction confirmed but failed');
    }

    // Extract withdraw request ID from receipt events
    const withdrawQueueNftAddress = getWithdrawQueueNFTAddress(
      env.provider,
      params.token_type
    );
    const withdrawRequestId = extractWithdrawRequestIdFromReceipt(
      receipt,
      withdrawQueueNftAddress
    );

    return {
      status: 'success',
      data: {
        token_type: params.token_type,
        transaction_hash: transaction_hash,
        liquid_token: liquidTokenName,
        unstaked_amount: params.amount,
        unstaked_amount_formatted: formatUnits(shares, decimals),
        withdraw_request_id: withdrawRequestId || 'Not found in events',
        underlying_token: underlyingTokenName,
        message: `Unstake request created. Wait 1-2 days before claiming ${underlyingTokenName}.`,
      },
    };
  } catch (error: any) {
    return {
      status: 'failure',
      error:
        error.message || `Unknown error during ${params.token_type} unstaking`,
    };
  }
};
