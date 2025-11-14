import {
  getLiquidTokenContract,
  getTokenDecimals,
  getLiquidTokenName,
  getUnderlyingTokenName,
} from '../../lib/utils/contracts.js';
import { GetTotalStakedSchema } from '../../schemas/index.js';
import { onchainRead, toolResult } from '@kasarlabs/ask-starknet-core';
import { formatUnits } from '../../lib/utils/formatting.js';

export const getTotalStaked = async (
  env: onchainRead,
  params: GetTotalStakedSchema
): Promise<toolResult> => {
  try {
    const liquidTokenContract = getLiquidTokenContract(
      env.provider,
      params.token_type
    );
    const decimals = getTokenDecimals(params.token_type);
    const liquidTokenName = getLiquidTokenName(params.token_type);
    const underlyingTokenName = getUnderlyingTokenName(params.token_type);

    const totalAssets = await liquidTokenContract.total_assets();

    return {
      status: 'success',
      data: {
        token_type: params.token_type,
        underlying_token: underlyingTokenName,
        liquid_token: liquidTokenName,
        total_staked: totalAssets.toString(),
        total_staked_formatted: formatUnits(totalAssets, decimals),
        description: `Total ${underlyingTokenName} staked on Endur.fi (TVL)`,
      },
    };
  } catch (error: any) {
    return {
      status: 'failure',
      error: error.message || 'Unknown error getting total staked',
    };
  }
};
