import { type Transfer } from '../models/transfer.js';
import { axiosClient } from './axios.js';
import { TransferResponseSchema } from './transfer.schema.js';

export const transfer = async (transfer: Transfer) => {
  const { data } = await axiosClient.post<unknown>(
    '/api/v1/user/transfer',
    transfer
  );

  return TransferResponseSchema.parse(data).data;
};
