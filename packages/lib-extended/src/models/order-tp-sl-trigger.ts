import { type Decimal, type Long } from '../utils/number.ts'
import { type OrderDebuggingAmounts } from './order-debugging-amounts.ts'
import { OrderSettlement } from './order-settlement.ts'
import {
  type OrderPriceType,
  type OrderTriggerPriceType,
  type SettlementSignature,
} from './order.types.ts'

export type OrderTpSlTriggerParam = {
  triggerPrice: Decimal
  triggerPriceType: OrderTriggerPriceType
  price: Decimal
  priceType: OrderPriceType
}

export class OrderTpSlTrigger {
  private readonly triggerPrice: Decimal
  private readonly triggerPriceType: OrderTriggerPriceType
  private readonly price: Decimal
  private readonly priceType: OrderPriceType
  private readonly settlement: OrderSettlement
  private readonly debuggingAmounts: OrderDebuggingAmounts

  private constructor({
    triggerPrice,
    triggerPriceType,
    price,
    priceType,
    settlement,
    debuggingAmounts,
  }: {
    triggerPrice: Decimal
    triggerPriceType: OrderTriggerPriceType
    price: Decimal
    priceType: OrderPriceType
    settlement: OrderSettlement
    debuggingAmounts: OrderDebuggingAmounts
  }) {
    this.triggerPrice = triggerPrice
    this.triggerPriceType = triggerPriceType
    this.price = price
    this.priceType = priceType
    this.settlement = settlement
    this.debuggingAmounts = debuggingAmounts
  }

  toJSON() {
    return {
      triggerPrice: this.triggerPrice.toString(10),
      triggerPriceType: this.triggerPriceType,
      price: this.price.toString(10),
      priceType: this.priceType,
      settlement: this.settlement.toJSON(),
      debuggingAmounts: this.debuggingAmounts.toJSON(),
    }
  }

  static create(
    vaultId: Long,
    triggerParams: OrderTpSlTriggerParam | undefined,
    orderSettlementSignature:
      | { signature: SettlementSignature; starkKey: string }
      | undefined,
    debuggingAmounts: OrderDebuggingAmounts | undefined,
  ) {
    if (!triggerParams || !orderSettlementSignature || !debuggingAmounts) {
      return undefined
    }

    return new OrderTpSlTrigger({
      triggerPrice: triggerParams.triggerPrice,
      triggerPriceType: triggerParams.triggerPriceType,
      price: triggerParams.price,
      priceType: triggerParams.priceType,
      debuggingAmounts,
      settlement: new OrderSettlement({
        signature: orderSettlementSignature.signature,
        starkKey: orderSettlementSignature.starkKey,
        collateralPosition: vaultId,
      }),
    })
  }
}
