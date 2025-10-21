import { axiosClient } from './axios.ts'
import { MarketsResponseSchema } from './markets.schema.ts'

export const getMarket = async (marketName: string) => {
  const { data } = await axiosClient.get<unknown>('/api/v1/info/markets', {
    params: {
      market: [marketName],
    },
  })

  return MarketsResponseSchema.parse(data).data[0]
}
