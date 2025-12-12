import {
  getLiquidTokenContract,
  getTokenDecimals,
  getLiquidTokenName,
  getUnderlyingTokenName,
} from '../../lib/utils/contracts.js';
import { PreviewStakeSchema } from '../../schemas/index.js';
import { onchainRead, toolResult } from '@kasarlabs/ask-starknet-core';
import { formatUnits, parseUnits } from '../../lib/utils/formatting.js';

export const previewStake = async (
  env: onchainRead,
  params: PreviewStakeSchema
): Promise<toolResult> => {
  try {
    const liquidTokenContract = getLiquidTokenContract(
      env.provider,
      params.token_type
    );
    const decimals = getTokenDecimals(params.token_type);
    const liquidTokenName = getLiquidTokenName(params.token_type);
    const underlyingTokenName = getUnderlyingTokenName(params.token_type);

    const amountBigInt = parseUnits(params.amount, decimals);

    // Preview how much liquid token will be received for the given underlying token amount
    const shares = await liquidTokenContract.preview_deposit(amountBigInt);

    return {
      status: 'success',
      data: {
        token_type: params.token_type,
        underlying_token: underlyingTokenName,
        liquid_token: liquidTokenName,
        amount: amountBigInt.toString(),
        amount_formatted: params.amount,
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
