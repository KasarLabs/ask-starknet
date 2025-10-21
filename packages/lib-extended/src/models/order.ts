import { addHours } from 'date-fns'

import { calcEntirePositionSize } from '../utils/calculation/calc-entire-position-size.ts'
import { generateNonce } from '../utils/generate-nonce.ts'
import { toHexString } from '../utils/hex.ts'
import { Decimal, Long } from '../utils/number.ts'
import { omitUndefined } from '../utils/omit-undefined.ts'
import { getOppositeOrderSide } from '../utils/side.ts'
import { getStarknetOrderMsgHash } from '../utils/signing/get-order-msg-hash.ts'
import { getStarkPublicKey } from '../utils/signing/get-stark-public-key.ts'
import { signMessage } from '../utils/signing/sign-message.ts'
import { OrderDebuggingAmounts } from './order-debugging-amounts.ts'
import { OrderSettlement } from './order-settlement.ts'
import { OrderTpSlTrigger, type OrderTpSlTriggerParam } from './order-tp-sl-trigger.ts'
import {
  type OrderContext,
  type OrderSide,
  type OrderTimeInForce,
  type OrderTpSlType,
  type OrderType,
} from './order.types.ts'

const ORDER_EXPIRATION_HOURS = 1
const ROUNDING_MODE_SELL = Decimal.ROUND_DOWN
const ROUNDING_MODE_BUY = Decimal.ROUND_UP
const ROUNDING_MODE_FEE = Decimal.ROUND_UP

export class Order {
  public readonly id: string

  private readonly market: string
  private readonly type: OrderType
  private readonly side: OrderSide
  private readonly qty: Decimal
  private readonly price: Decimal
  private readonly timeInForce: OrderTimeInForce
  private readonly expiryEpochMillis: number
  private readonly fee: Decimal
  private readonly nonce: Long
  private readonly settlement?: OrderSettlement
  private readonly reduceOnly?: boolean
  private readonly postOnly?: boolean
  private readonly tpSlType?: OrderTpSlType
  private readonly takeProfit?: OrderTpSlTrigger
  private readonly stopLoss?: OrderTpSlTrigger
  private readonly cancelId?: string
  private readonly builderId?: Long
  private readonly builderFee?: Decimal
  private readonly debuggingAmounts?: OrderDebuggingAmounts

  private constructor({
    id,
    market,
    type,
    side,
    qty,
    price,
    timeInForce,
    expiryEpochMillis,
    fee,
    nonce,
    settlement,
    reduceOnly,
    postOnly,
    tpSlType,
    takeProfit,
    stopLoss,
    cancelId,
    builderId,
    builderFee,
    debuggingAmounts,
  }: {
    id: string
    market: string
    type: OrderType
    side: OrderSide
    qty: Decimal
    price: Decimal
    timeInForce: OrderTimeInForce
    expiryEpochMillis: number
    fee: Decimal
    nonce: Long
    settlement?: OrderSettlement
    reduceOnly?: boolean
    postOnly?: boolean
    tpSlType?: OrderTpSlType
    takeProfit?: OrderTpSlTrigger
    stopLoss?: OrderTpSlTrigger
    cancelId?: string
    builderId?: Long
    builderFee?: Decimal
    debuggingAmounts?: OrderDebuggingAmounts
  }) {
    this.id = id
    this.market = market
    this.type = type
    this.side = side
    this.qty = qty
    this.price = price
    this.timeInForce = timeInForce
    this.expiryEpochMillis = expiryEpochMillis
    this.fee = fee
    this.nonce = nonce
    this.settlement = settlement
    this.reduceOnly = reduceOnly
    this.postOnly = postOnly
    this.tpSlType = tpSlType
    this.takeProfit = takeProfit
    this.stopLoss = stopLoss
    this.cancelId = cancelId
    this.builderId = builderId
    this.builderFee = builderFee
    this.debuggingAmounts = debuggingAmounts
  }

  toJSON() {
    return omitUndefined({
      id: this.id ? Long(this.id, 16).toString(10) : undefined,
      market: this.market,
      type: this.type,
      side: this.side,
      qty: this.qty.toString(10),
      price: this.price.toString(10),
      timeInForce: this.timeInForce,
      expiryEpochMillis: this.expiryEpochMillis,
      fee: this.fee.toString(10),
      nonce: this.nonce.toString(10),
      settlement: this.settlement?.toJSON(),
      reduceOnly: this.reduceOnly,
      postOnly: this.postOnly,
      tpSlType: this.tpSlType,
      takeProfit: this.takeProfit?.toJSON(),
      stopLoss: this.stopLoss?.toJSON(),
      cancelId: this.cancelId,
      builderId: this.builderId?.toString(10),
      builderFee: this.builderFee?.toString(10),
      debuggingAmounts: this.debuggingAmounts?.toJSON(),
    })
  }

  static create({
    marketName,
    orderType,
    side,
    amountOfSynthetic,
    price,
    timeInForce,
    expiryTime,
    reduceOnly,
    postOnly,
    tpSlType,
    takeProfit,
    stopLoss,
    cancelId,
    ctx,
  }: {
    marketName: string
    orderType: OrderType
    side: OrderSide
    amountOfSynthetic: Decimal
    price: Decimal
    timeInForce: OrderTimeInForce
    expiryTime?: Date
    reduceOnly?: boolean
    postOnly?: boolean
    tpSlType?: OrderTpSlType
    takeProfit?: OrderTpSlTriggerParam
    stopLoss?: OrderTpSlTriggerParam
    cancelId?: string
    ctx: OrderContext
  }) {
    const { feeRate, vaultId, minOrderSizeChange, maxPositionValue } = ctx

    const nonce = Long(generateNonce())
    const expiryEpochMillis = (
      expiryTime ?? addHours(new Date(), ORDER_EXPIRATION_HOURS)
    ).getTime()
    const totalFeeRate = ctx.builderFee ? feeRate.plus(ctx.builderFee) : feeRate
    const createOrderParamsArgs = {
      side,
      amountOfSynthetic,
      price,
      expiryEpochMillis,
      nonce,
      totalFeeRate,
      ctx,
    }

    const tpSlSide = orderType !== 'TPSL' ? getOppositeOrderSide(side) : side
    const tpAmountOfSynthetic =
      takeProfit && tpSlType === 'POSITION'
        ? calcEntirePositionSize(takeProfit.price, minOrderSizeChange, maxPositionValue)
        : amountOfSynthetic
    const slAmountOfSynthetic =
      stopLoss && tpSlType === 'POSITION'
        ? calcEntirePositionSize(stopLoss.price, minOrderSizeChange, maxPositionValue)
        : amountOfSynthetic
    const createTpOrderParams = takeProfit
      ? Order.getCreateOrderParams({
          ...createOrderParamsArgs,
          side: tpSlSide,
          price: takeProfit.price,
          amountOfSynthetic: tpAmountOfSynthetic,
        })
      : undefined
    const createSlOrderParams = stopLoss
      ? Order.getCreateOrderParams({
          ...createOrderParamsArgs,
          side: tpSlSide,
          price: stopLoss.price,
          amountOfSynthetic: slAmountOfSynthetic,
        })
      : undefined

    const createOrderParams = Order.getCreateOrderParams(createOrderParamsArgs)
    const settlement =
      orderType !== 'TPSL'
        ? new OrderSettlement({
            signature: createOrderParams.orderSignature.signature,
            starkKey: createOrderParams.orderSignature.starkKey,
            collateralPosition: vaultId,
          })
        : undefined

    return new Order({
      id: createOrderParams.orderHash,
      market: marketName,
      type: orderType,
      side,
      qty: amountOfSynthetic,
      price,
      timeInForce,
      expiryEpochMillis,
      fee: totalFeeRate,
      nonce,
      settlement,
      reduceOnly,
      postOnly,
      tpSlType,
      takeProfit: OrderTpSlTrigger.create(
        vaultId,
        takeProfit,
        createTpOrderParams?.orderSignature,
        createTpOrderParams?.debuggingAmounts,
      ),
      stopLoss: OrderTpSlTrigger.create(
        vaultId,
        stopLoss,
        createSlOrderParams?.orderSignature,
        createSlOrderParams?.debuggingAmounts,
      ),
      cancelId,
      builderId: ctx.builderId,
      builderFee: ctx.builderFee,
      debuggingAmounts: createOrderParams.debuggingAmounts,
    })
  }

  private static getCreateOrderParams({
    side,
    amountOfSynthetic,
    price,
    expiryEpochMillis,
    nonce,
    totalFeeRate,
    ctx,
  }: {
    side: OrderSide
    amountOfSynthetic: Decimal
    price: Decimal
    expiryEpochMillis: number
    nonce: Long
    totalFeeRate: Decimal
    ctx: OrderContext
  }) {
    const roundingMode = side === 'BUY' ? ROUNDING_MODE_BUY : ROUNDING_MODE_SELL

    const {
      assetIdCollateral,
      assetIdSynthetic,
      settlementResolutionCollateral,
      settlementResolutionSynthetic,
      vaultId,
      starkPrivateKey,
    } = ctx

    const collateralAmount = amountOfSynthetic.times(price)
    const fee = totalFeeRate.times(collateralAmount)

    const collateralAmountStark = collateralAmount
      .times(settlementResolutionCollateral)
      .integerValue(roundingMode)
    const feeStark = fee
      .times(settlementResolutionCollateral)
      .integerValue(ROUNDING_MODE_FEE)
    const syntheticAmountStark = amountOfSynthetic
      .times(settlementResolutionSynthetic)
      .integerValue(roundingMode)

    const orderHash = getStarknetOrderMsgHash({
      side,
      nonce,
      assetIdCollateral,
      assetIdSynthetic,
      collateralAmountStark,
      feeStark,
      syntheticAmountStark,
      expiryEpochMillis,
      vaultId,
      starkPublicKey: toHexString(getStarkPublicKey(starkPrivateKey)),
      starknetDomain: ctx.starknetDomain,
    })
    const orderSignature = signMessage(orderHash, starkPrivateKey)

    return {
      orderHash,
      orderSignature,
      debuggingAmounts: new OrderDebuggingAmounts({
        collateralAmount: collateralAmountStark,
        feeAmount: feeStark,
        syntheticAmount: syntheticAmountStark,
      }),
    }
  }
}
