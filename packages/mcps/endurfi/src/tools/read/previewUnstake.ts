import {
  getLiquidTokenContract,
  getTokenDecimals,
  getLiquidTokenName,
  getUnderlyingTokenName,
} from '../../lib/utils/contracts.js';
import { PreviewUnstakeSchema } from '../../schemas/index.js';
import { onchainRead, toolResult } from '@kasarlabs/ask-starknet-core';
import { formatUnits } from '../../lib/utils/formatting.js';

export const previewUnstake = async (
  env: onchainRead,
  params: PreviewUnstakeSchema
): Promise<toolResult> => {
  try {
    const liquidTokenContract = getLiquidTokenContract(
      env.provider,
      params.token_type
    );
    const decimals = getTokenDecimals(params.token_type);
    const liquidTokenName = getLiquidTokenName(params.token_type);
    const underlyingTokenName = getUnderlyingTokenName(params.token_type);

    const assets = await liquidTokenContract.preview_redeem(
      BigInt(params.amount)
    );

    return {
      status: 'success',
      data: {
        token_type: params.token_type,
        liquid_token: liquidTokenName,
        underlying_token: underlyingTokenName,
        amount: params.amount,
        amount_formatted: formatUnits(BigInt(params.amount), decimals),
        estimated_assets: assets.toString(),
        estimated_assets_formatted: formatUnits(assets, decimals),
      },
    };
  } catch (error: any) {
    return {
      status: 'failure',
      error: error.message || 'Unknown error previewing unstake',
    };
  }
};
