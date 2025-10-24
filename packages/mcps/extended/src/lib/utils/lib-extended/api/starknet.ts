import { axiosClient } from './axios.js';
import { StarknetDomainResponseSchema } from './starknet.schema.js';

export const getStarknetDomain = async () => {
  const { data } = await axiosClient.get<unknown>('/api/v1/info/starknet');

  return StarknetDomainResponseSchema.parse(data).data;
};
