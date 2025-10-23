import { ExtendedApiEnv, ExtendedApiResponse, Balance } from '../../lib/types/index.js';
import { apiGet } from '../../lib/utils/api.js';
import { GetBalanceSchema } from '../../schemas/index.js';

export const getBalance = async (
  env: ExtendedApiEnv,
  params: GetBalanceSchema
): Promise<ExtendedApiResponse<Balance>> => {
  try {
    const data = await apiGet<Balance>(
      env,
      '/api/v1/user/balance',
      true
    );

    return {
      status: 'success',
      data,
    };
  } catch (error: any) {
    console.error('Error getting balance:', error);

    // 404 means balance is 0
    if (error.message?.includes('404')) {
      return {
        status: 'success',
        data: {
          collateralName: 'USDC',
          balance: '0',
          equity: '0',
          availableForTrade: '0',
          availableForWithdrawal: '0',
          unrealisedPnl: '0',
          initialMargin: '0',
          marginRatio: '0',
          updatedTime: Date.now(),
          exposure: '0',
          leverage: '0',
        },
      };
    }

    return {
      status: 'failure',
      error: error.message || 'Failed to get balance',
    };
  }
};
