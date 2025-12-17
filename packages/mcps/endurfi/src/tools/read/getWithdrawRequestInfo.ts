import {
  getWithdrawQueueNFTContract,
  getTokenDecimals,
  getLiquidTokenName,
  getUnderlyingTokenName,
} from '../../lib/utils/contracts.js';
import { GetWithdrawRequestInfoSchema } from '../../schemas/index.js';
import { onchainRead, toolResult } from '@kasarlabs/ask-starknet-core';
import { formatUnits } from '../../lib/utils/formatting.js';

export const getWithdrawRequestInfo = async (
  env: onchainRead,
  params: GetWithdrawRequestInfoSchema
): Promise<toolResult> => {
  try {
    const withdrawQueueContract = getWithdrawQueueNFTContract(
      env.provider,
      params.token_type
    );
    const decimals = getTokenDecimals(params.token_type);
    const liquidTokenName = getLiquidTokenName(params.token_type);
    const underlyingTokenName = getUnderlyingTokenName(params.token_type);

    const requestId = BigInt(params.withdraw_request_id);

    const requestInfo = await withdrawQueueContract.get_request_info(requestId);

    const assets = requestInfo.assets;
    const shares = requestInfo.shares;
    const isClaimed = requestInfo.isClaimed;
    const timestamp = BigInt(requestInfo.timestamp);
    const claimTime = BigInt(requestInfo.claimTime);

    // Helper function to convert u256 to BigInt (handles both object {low, high} and direct values)
    const toBigInt = (value: any): bigint => {
      if (typeof value === 'bigint') return value;
      if (typeof value === 'string') return BigInt(value);
      if (typeof value === 'number') return BigInt(value);
      // Handle u256 struct with low and high
      if (
        value &&
        typeof value === 'object' &&
        'low' in value &&
        'high' in value
      ) {
        const low = BigInt(value.low);
        const high = BigInt(value.high);
        return (high << 128n) + low;
      }
      // Fallback to string conversion
      return BigInt(value.toString());
    };

    const assetsBigInt = toBigInt(assets);
    const sharesBigInt = toBigInt(shares);

    if (assetsBigInt === 0n && sharesBigInt === 0n && timestamp === 0n) {
      return {
        status: 'failure',
        error: `Withdraw request ${params.withdraw_request_id} does not exist`,
      };
    }

    // Calculate if claimable (current time > claimTime)
    const currentTime = BigInt(Math.floor(Date.now() / 1000));
    const isClaimable = !isClaimed && currentTime >= claimTime;

    return {
      status: 'success',
      data: {
        token_type: params.token_type,
        underlying_token: underlyingTokenName,
        liquid_token: liquidTokenName,
        withdraw_request_id: params.withdraw_request_id,
        assets_amount: assetsBigInt.toString(),
        assets_amount_formatted: formatUnits(assetsBigInt, decimals),
        shares_amount: sharesBigInt.toString(),
        shares_amount_formatted: formatUnits(sharesBigInt, decimals),
        is_claimed: isClaimed,
        timestamp: timestamp.toString(),
        claim_time: claimTime.toString(),
        is_claimable: isClaimable,
        status: isClaimed ? 'claimed' : isClaimable ? 'ready' : 'pending',
      },
    };
  } catch (error: any) {
    return {
      status: 'failure',
      error: error.message || 'Unknown error getting withdraw request info',
    };
  }
};
