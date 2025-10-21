import { Long } from '../utils/number.ts'
import { axiosClient } from './axios.ts'
import { FeesResponseSchema } from './fees.schema.ts'

export const getFees = async ({
  marketName,
  builderId,
}: {
  marketName: string
  builderId?: Long
}) => {
  const { data } = await axiosClient.get<unknown>('/api/v1/user/fees', {
    params: {
      market: [marketName],
      builderId: builderId?.toString(),
    },
  })

  return FeesResponseSchema.parse(data).data[0]
}
