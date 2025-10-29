import {
  getLiquidTokenContract,
  getTokenDecimals,
  getLiquidTokenName,
  getUnderlyingTokenName,
} from '../../lib/utils/contracts.js';
import { PreviewStakeSchema } from '../../schemas/index.js';
import { onchainRead } from '@ijusttookadnatest/ask-starknet-core';
import { formatUnits } from '../../lib/utils/formatting.js';

export const previewStake = async (
  env: onchainRead,
  params: PreviewStakeSchema
) => {
  try {
    const liquidTokenContract = getLiquidTokenContract(
      env.provider,
      params.token_type
    );
    const decimals = getTokenDecimals(params.token_type);
    const liquidTokenName = getLiquidTokenName(params.token_type);
    const underlyingTokenName = getUnderlyingTokenName(params.token_type);

    // Preview how much liquid token will be received for the given underlying token amount
    const shares = await liquidTokenContract.preview_deposit(
      BigInt(params.amount)
    );

    return {
      status: 'success',
      data: {
        token_type: params.token_type,
        underlying_token: underlyingTokenName,
        liquid_token: liquidTokenName,
        amount: params.amount,
        amount_formatted: formatUnits(BigInt(params.amount), decimals),
        estimated_shares: shares.toString(),
        estimated_shares_formatted: formatUnits(shares, decimals),
      },
    };
  } catch (error: any) {
    return {
      status: 'failure',
      error: error.message || 'Unknown error previewing stake',
    };
  }
};
