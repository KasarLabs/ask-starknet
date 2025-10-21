import { ExtendedApiEnv, ExtendedApiResponse, Order } from '../../lib/types/index.js';
import { apiPost } from '../../lib/utils/api.js';
import { CreateLimitOrderSchema } from '../../schemas/index.js';
import { signOrderMessage, createOrderMessageHash } from '../../lib/utils/signature.js';

export const createLimitOrder = async (
  env: ExtendedApiEnv,
  params: CreateLimitOrderSchema
): Promise<ExtendedApiResponse<Order>> => {
  try {
    if (!env.EXTENDED_STARKKEY_PRIVATE) {
      throw new Error('EXTENDED_STARKKEY_PRIVATE is required for order creation');
    }

    // Generate nonce (must be >= 1 and <= 2^31)
    const nonce = params.nonce || Math.floor(Math.random() * Math.pow(2, 31)) + 1;

    // Calculate expiry (default to 30 days from now if not provided)
    const expiryEpochMillis = params.expiry_epoch_millis || Date.now() + (30 * 24 * 60 * 60 * 1000);

    // Create message hash for signing
    const messageHash = createOrderMessageHash({
      market: params.market,
      side: params.side,
      price: params.price,
      quantity: params.qty,
      nonce,
      expiryEpochMillis,
    });

    // Sign the order
    const signature = signOrderMessage(env.EXTENDED_STARKKEY_PRIVATE, messageHash);

    // Build order payload
    const orderPayload = {
      id: params.external_id,
      market: params.market,
      type: 'LIMIT',
      side: params.side,
      qty: params.qty,
      price: params.price,
      timeInForce: params.time_in_force || 'GTC',
      expiryEpochMillis,
      postOnly: params.post_only || false,
      reduceOnly: params.reduce_only || false,
      selfTradeProtectionLevel: 'ACCOUNT',
      settlement: {
        starkKey: signature.starkKey,
        signature: {
          r: signature.r,
          s: signature.s,
        },
        nonce,
      },
    };

    const response = await apiPost<{ data: Order }>(
      env,
      '/api/v1/user/order',
      orderPayload
    );

    return {
      status: 'success',
      data: response.data,
    };
  } catch (error: any) {
    console.error('Error creating limit order:', error);
    return {
      status: 'failure',
      error: error.message || 'Failed to create limit order',
    };
  }
};
