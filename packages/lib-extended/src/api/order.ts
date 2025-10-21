import { axiosClient } from './axios.ts'
import { PlacedOrderResponseSchema } from './orders.schema.ts'

export const placeOrder = async (args: { order: object }) => {
  const { data } = await axiosClient.post<unknown>('/api/v1/user/order', args.order)

  return PlacedOrderResponseSchema.parse(data).data
}
