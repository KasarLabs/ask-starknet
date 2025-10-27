import {
  getLiquidTokenContract,
  getTokenDecimals,
  getLiquidTokenName,
  getUnderlyingTokenName,
} from '../../lib/utils/contracts.js';
import { GetUserBalanceSchema } from '../../schemas/index.js';
import { onchainRead, onchainWrite } from '@ask-starknet/core';
import { formatUnits } from '../../lib/utils/formatting.js';

export const getUserBalance = async (
  env: onchainRead | onchainWrite,
  params: GetUserBalanceSchema
) => {
  try {
    const liquidTokenContract = getLiquidTokenContract(
      env.provider,
      params.token_type
    );
    const decimals = getTokenDecimals(params.token_type);
    const liquidTokenName = getLiquidTokenName(params.token_type);
    const underlyingTokenName = getUnderlyingTokenName(params.token_type);

    let userAddress: string;
    if (params.user_address) {
      userAddress = params.user_address;
    } else if ('account' in env) {
      userAddress = env.account.address;
    } else {
      throw new Error('No user address provided and no account connected');
    }

    const liquidBalance = await liquidTokenContract.balance_of(userAddress);

    const underlyingValue =
      await liquidTokenContract.convert_to_assets(liquidBalance);

    return {
      status: 'success',
      data: {
        token_type: params.token_type,
        user_address: userAddress,
        liquid_token: liquidTokenName,
        liquid_balance: liquidBalance.toString(),
        liquid_balance_formatted: formatUnits(liquidBalance, decimals),
        underlying_token: underlyingTokenName,
        underlying_value: underlyingValue.toString(),
        underlying_value_formatted: formatUnits(underlyingValue, decimals),
      },
    };
  } catch (error: any) {
    return {
      status: 'failure',
      error: error.message || 'Unknown error getting user balance',
    };
  }
};
