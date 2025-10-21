import { z } from 'zod/v4'

import { zodHexString, zodLong } from '../utils/zod.ts'

export const AccountInfoSchema = z.object({
  accountId: zodLong(),
  description: z.string(),
  accountIndex: z.number(),
  status: z.string(),
  l2Key: zodHexString(),
  l2Vault: zodLong(),
  apiKeys: z.string().array(),
})

export const AccountsInfoResponseSchema = z.object({ data: AccountInfoSchema.array() })

export type AccountInfo = z.infer<typeof AccountInfoSchema>
