import { invariant } from '../invariant.ts'
import { Decimal } from '../number.ts'

/**
 * This calculation is required to avoid a case when the position at
 * the time of TPSL execution has a bigger size than a signed TPSL order size
 */
export const calcEntirePositionSize = (
  /**
   * TP or SL order price
   */
  price: Decimal,
  minOrderSizeChange: Decimal,
  maxPositionValue: Decimal,
) => {
  invariant(price.gt(0), '`price` must be greater than 0')

  return maxPositionValue
    .times(50)
    .div(price)
    .decimalPlaces(minOrderSizeChange.decimalPlaces(), Decimal.ROUND_DOWN)
}
