// import { ExtendedApiEnv, ExtendedApiResponse, Order, AccountInfo } from '../../lib/types/index.js';
// import { apiPost, apiGet } from '../../lib/utils/api.js';
// import { CreateLimitOrderSchema } from '../../schemas/index.js';
// import { signOrderMessage, createOrderMessageHash } from '../../lib/utils/signature.js';

// export const createLimitOrder = async (
//   env: ExtendedApiEnv,
//   params: CreateLimitOrderSchema
// ): Promise<ExtendedApiResponse<Order>> => {
//   try {
//     if (!env.EXTENDED_STARKKEY_PRIVATE) {
//       throw new Error('EXTENDED_STARKKEY_PRIVATE is required for order creation');
//     }

//     // Get user account info
//     const accountInfoResponse = await apiGet<{ data: AccountInfo }>(env, '/api/v1/user/account/info', true);
//     const vault = accountInfoResponse.data.l2Vault;

//     // Get market L2 config
//     const marketInfoResponse = await apiGet<{
//       status: string;
//       data: Array<{
//         l2Config: {
//           collateralId: string;
//           collateralResolution: number;
//           syntheticId: string;
//           syntheticResolution: number;
//         };
//       }>;
//     }>(env, `/api/v1/info/markets?market=${params.market}`, false);

//     if (marketInfoResponse.status !== 'OK' || !marketInfoResponse.data || marketInfoResponse.data.length === 0) {
//       throw new Error(`Failed to fetch market info for ${params.market}`);
//     }

//     const l2Config = marketInfoResponse.data[0].l2Config;

//     // Generate nonce (must be >= 1 and <= 2^31)
//     const nonce = params.nonce || Math.floor(Math.random() * Math.pow(2, 31)) + 1;

//     // Calculate expiry (default to 30 days from now if not provided)
//     const expiryEpochMillis = params.expiry_epoch_millis || Date.now() + (30 * 24 * 60 * 60 * 1000);

//     // Convert amounts to quantums following ts-extended logic exactly
//     const qtyFloat = parseFloat(params.qty);
//     const priceFloat = parseFloat(params.price);
//     const feeFloat = parseFloat('0.001');

//     // Calculate amounts following ts-extended pattern exactly
//     const collateralAmount = qtyFloat * priceFloat;
//     const fee = feeFloat * collateralAmount;

//     // Convert to Stark amounts with proper rounding (following ts-extended)
//     const roundingMode = params.side === 'BUY' ? 'ceil' : 'floor';
//     const collateralAmountStark = BigInt(Math.round(collateralAmount * l2Config.collateralResolution));
//     const feeStark = BigInt(Math.round(fee * l2Config.collateralResolution));
//     const syntheticAmountStark = BigInt(Math.round(qtyFloat * l2Config.syntheticResolution));

//     // Get user's L2 public key
//     const { starkKey } = signOrderMessage(env.EXTENDED_STARKKEY_PRIVATE, '0x0');

//     // Create message hash for signing using Poseidon (exact ts-extended pattern)
//     const messageHash = createOrderMessageHash({
//       side: params.side,
//       nonce: BigInt(nonce),
//       assetIdCollateral: l2Config.collateralId,
//       assetIdSynthetic: l2Config.syntheticId,
//       collateralAmountStark,
//       feeStark,
//       syntheticAmountStark,
//       expiryEpochMillis,
//       vaultId: BigInt(parseInt(vault, 16)),
//       starkPublicKey: starkKey,
//       starknetDomain: {
//         name: 'Perpetuals',
//         version: 'v0',
//         chainId: 'SN_SEPOLIA',
//         revision: 1,
//       },
//     });

//     // Sign the order
//     const signature = signOrderMessage(env.EXTENDED_STARKKEY_PRIVATE, messageHash);

//     // Build order payload
//     const orderPayload = {
//       id: params.external_id,
//       market: params.market,
//       type: 'LIMIT',
//       side: params.side,
//       qty: params.qty,
//       price: params.price,
//       timeInForce: params.time_in_force || 'GTC',
//       expiryEpochMillis,
//       postOnly: params.post_only || false,
//       reduceOnly: params.reduce_only || false,
//       selfTradeProtectionLevel: 'ACCOUNT',
//       settlement: {
//         starkKey: signature.starkKey,
//         signature: {
//           r: signature.r,
//           s: signature.s,
//         },
//         nonce,
//       },
//     };

//     const response = await apiPost<{ data: Order }>(
//       env,
//       '/api/v1/user/order',
//       orderPayload
//     );

//     return {
//       status: 'success',
//       data: response.data,
//     };
//   } catch (error: any) {
//     console.error('Error creating limit order:', error);
//     return {
//       status: 'failure',
//       error: error.message || 'Failed to create limit order',
//     };
//   }
// };
