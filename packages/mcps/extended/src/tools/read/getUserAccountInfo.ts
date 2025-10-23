import { ExtendedApiEnv, ExtendedApiResponse, AccountInfo } from '../../lib/types/index.js';
import { apiGet } from '../../lib/utils/api.js';
import { GetUserAccountInfoSchema } from '../../schemas/index.js';

export const getUserAccountInfo = async (
  env: ExtendedApiEnv,
  params: GetUserAccountInfoSchema
): Promise<ExtendedApiResponse<AccountInfo>> => {
  try {
    const data = await apiGet<AccountInfo>(
      env,
      '/api/v1/user/account/info',
      true
    );

    return {
      status: 'success',
      data,
    };
  } catch (error: any) {
    console.error('Error getting user account info:', error);
    return {
      status: 'failure',
      error: error.message || 'Failed to get user account info',
    };
  }
};
