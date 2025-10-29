import {
  getWithdrawQueueNFTContract,
  getTokenDecimals,
  getLiquidTokenName,
  getUnderlyingTokenName,
} from '../../lib/utils/contracts.js';
import { GetWithdrawRequestInfoSchema } from '../../schemas/index.js';
import { onchainRead } from '@ijusttookadnatest/ask-starknet-core-test';
import { formatUnits } from '../../lib/utils/formatting.js';

export const getWithdrawRequestInfo = async (
  env: onchainRead,
  params: GetWithdrawRequestInfoSchema
) => {
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
        assets_amount: assets.toString(),
        assets_amount_formatted: formatUnits(assets, decimals),
        shares_amount: shares.toString(),
        shares_amount_formatted: formatUnits(shares, decimals),
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
