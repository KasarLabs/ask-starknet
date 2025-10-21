import { ExtendedApiEnv, ExtendedApiResponse } from '../../lib/types/index.js';
import { apiPost } from '../../lib/utils/api.js';
import { CreateWithdrawalSchema } from '../../schemas/index.js';

/**
 * Create a Starknet withdrawal
 * @param env - Extended API environment configuration
 * @param params - Withdrawal parameters
 * @returns Response with withdrawal ID
 */
export const createWithdrawal = async (
  env: ExtendedApiEnv,
  params: CreateWithdrawalSchema
): Promise<ExtendedApiResponse<{ withdrawalId: number }>> => {
  try {
    if (!env.EXTENDED_STARKKEY_PRIVATE) {
      throw new Error('STARKNET_PRIVATE_KEY is required for withdrawal creation');
    }

    // Generate settlement signature
    // Note: This is a placeholder - actual implementation would need to follow
    // the Extended settlement signature format from their Python SDK
    const settlement = {
      recipient: params.recipient_address,
      positionId: params.position_id,
      collateralId: params.collateral_id || '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC default
      amount: params.amount_in_wei,
      expiration: {
        seconds: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours from now
      },
      salt: Math.floor(Math.random() * Math.pow(2, 31)),
      signature: {
        r: '0x0', // Placeholder - needs proper signature implementation
        s: '0x0', // Placeholder - needs proper signature implementation
      },
    };

    // Build withdrawal payload
    const withdrawalPayload = {
      accountId: params.account_id.toString(),
      amount: params.amount,
      chainId: 'STRK',
      asset: params.asset || 'USD',
      settlement,
    };

    const response = await apiPost<{ status: string; data: number }>(
      env,
      '/api/v1/user/withdrawal',
      withdrawalPayload
    );

    return {
      status: 'success',
      data: {
        withdrawalId: response.data,
      },
    };
  } catch (error: any) {
    console.error('Error creating withdrawal:', error);
    return {
      status: 'failure',
      error: error.message || 'Failed to create withdrawal',
    };
  }
};
