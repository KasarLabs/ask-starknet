import { type OrderSide } from '../models/order.types.ts'

export const getOppositeOrderSide = (side: OrderSide) => {
  return side === 'BUY' ? 'SELL' : 'BUY'
}
