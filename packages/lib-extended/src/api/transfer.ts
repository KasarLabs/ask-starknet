import { type Transfer } from '../models/transfer.ts'
import { axiosClient } from './axios.ts'
import { TransferResponseSchema } from './transfer.schema.ts'

export const transfer = async (transfer: Transfer) => {
  const { data } = await axiosClient.post<unknown>('/api/v1/user/transfer', transfer)

  return TransferResponseSchema.parse(data).data
}
