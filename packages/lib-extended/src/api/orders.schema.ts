import { z } from 'zod/v4'

import { zodDecimal, zodLong } from '../utils/zod.ts'

const PlacedOrderSchema = z.object({
  id: zodLong(),
  externalId: z.string(),
})

const TriggerPriceTypeSchema = z.enum(['UNKNOWN', 'MARK', 'INDEX', 'LAST'])
const ExecutionPriceTypeSchema = z.enum(['UNKNOWN', 'MARKET', 'LIMIT'])
const OrderPriceTypeSchema = z.enum(['UNKNOWN', 'MARKET', 'LIMIT'])
const OrderStatusSchema = z.enum([
  'UNKNOWN',
  'NEW',
  'UNTRIGGERED',
  'PARTIALLY_FILLED',
  'FILLED',
  'CANCELLED',
  'EXPIRED',
  'REJECTED',
])
const OrderTimeInForceSchema = z.enum(['GTT', 'IOC', 'FOK'])
const TpSlTypeSchema = z.enum(['UNKNOWN', 'ORDER', 'POSITION'])

const OrderConditionalTriggerSchema = z.object({
  triggerPrice: zodDecimal(),
  triggerPriceType: TriggerPriceTypeSchema,
  executionPriceType: ExecutionPriceTypeSchema,
  direction: z.enum(['UP', 'DOWN', 'UNKNOWN']),
})

const OrderTwapParamsSchema = z.object({
  durationSeconds: z.number(),
  frequencySeconds: z.number(),
  randomise: z.boolean(),
})

const OrderTpSlTriggerSchema = z.object({
  triggerPrice: zodDecimal(),
  triggerPriceType: TriggerPriceTypeSchema,
  price: zodDecimal(),
  priceType: OrderPriceTypeSchema,
  status: OrderStatusSchema.optional(),
  starkExOrder: z.string().optional(),
  starkExSignature: z.string().optional(),
})

const UserOrderSchema = z.object({
  id: zodLong(),
  accountId: zodLong(),
  externalId: z.string(),
  market: z.string(),
  type: z.enum(['LIMIT', 'MARKET', 'CONDITIONAL', 'TPSL', 'TWAP']),
  side: z.enum(['BUY', 'SELL']),
  status: OrderStatusSchema,
  statusReason: z.string().optional(),
  price: zodDecimal().optional(),
  averagePrice: zodDecimal().optional(),
  qty: zodDecimal(),
  filledQty: zodDecimal().optional(),
  trigger: OrderConditionalTriggerSchema.optional(),
  tpSlType: TpSlTypeSchema.optional(),
  takeProfit: OrderTpSlTriggerSchema.optional(),
  stopLoss: OrderTpSlTriggerSchema.optional(),
  twap: OrderTwapParamsSchema.optional(),
  reduceOnly: z.boolean(),
  postOnly: z.boolean(),
  createdTime: z.number(),
  updatedTime: z.number(),
  expireTime: z.number().optional(),
  timeInForce: OrderTimeInForceSchema,
  prevOrderId: z.string().optional(),
})

export const PlacedOrderResponseSchema = z.object({ data: PlacedOrderSchema })
export const UserOrdersResponseSchema = z.object({ data: UserOrderSchema.array() })
