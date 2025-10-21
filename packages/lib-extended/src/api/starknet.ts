import { axiosClient } from './axios.ts'
import { StarknetDomainResponseSchema } from './starknet.schema.ts'

export const getStarknetDomain = async () => {
  const { data } = await axiosClient.get<unknown>('/api/v1/info/starknet')

  return StarknetDomainResponseSchema.parse(data).data
}
