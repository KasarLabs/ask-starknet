import { type Long } from '../utils/number.ts'

export class OrderDebuggingAmounts {
  private readonly collateralAmount: Long
  private readonly feeAmount: Long
  private readonly syntheticAmount: Long

  constructor(amounts: {
    collateralAmount: Long
    feeAmount: Long
    syntheticAmount: Long
  }) {
    this.collateralAmount = amounts.collateralAmount
    this.feeAmount = amounts.feeAmount
    this.syntheticAmount = amounts.syntheticAmount
  }

  toJSON() {
    return {
      collateralAmount: this.collateralAmount.toString(10),
      feeAmount: this.feeAmount.toString(10),
      syntheticAmount: this.syntheticAmount.toString(10),
    }
  }
}
