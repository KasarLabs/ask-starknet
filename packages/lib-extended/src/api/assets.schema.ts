import { z } from 'zod/v4'

import { zodHexString, zodLong } from '../utils/zod.ts'

export const AssetSchema = z.object({
  id: zodLong(),
  name: z.string(),
  symbol: z.string(),
  precision: z.number(),
  isActive: z.boolean(),
  isCollateral: z.boolean(),
  starkexId: zodHexString(),
  starkexResolution: z.number(),
  l1Id: z.string(),
  l1Resolution: z.number(),
  version: z.number(),
})

export const AssetsResponseSchema = z.object({ data: AssetSchema.array() })
