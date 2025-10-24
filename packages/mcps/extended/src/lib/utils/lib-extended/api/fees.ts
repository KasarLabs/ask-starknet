import { Long } from '../utils/number.js';
import { axiosClient } from './axios.js';
import { FeesResponseSchema } from './fees.schema.js';

export const getFees = async ({
  marketName,
  builderId,
}: {
  marketName: string;
  builderId?: Long;
}) => {
  const { data } = await axiosClient.get<unknown>('/api/v1/user/fees', {
    params: {
      market: [marketName],
      builderId: builderId?.toString(),
    },
  });

  return FeesResponseSchema.parse(data).data[0];
};
