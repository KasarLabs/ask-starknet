import { AccountsInfoResponseSchema } from './account-info.schema.js';
import { axiosClient } from './axios.js';

export const getAccounts = async () => {
  const { data } = await axiosClient.get<unknown>('/api/v1/user/accounts');

  return AccountsInfoResponseSchema.parse(data).data;
};
