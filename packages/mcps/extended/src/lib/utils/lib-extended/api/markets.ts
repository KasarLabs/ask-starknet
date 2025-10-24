import { axiosClient } from './axios.js'
import { MarketsResponseSchema } from './markets.schema.js'

export const getMarket = async (marketName: string) => {
  const { data } = await axiosClient.get<unknown>('/api/v1/info/markets', {
    params: {
      market: [marketName],
    },
  })

  return MarketsResponseSchema.parse(data).data[0]
}
