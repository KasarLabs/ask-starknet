import { z } from 'zod/v4'

import { zodDecimal } from '../utils/zod.ts'

export const FeesSchema = z.object({
  market: z.string(),
  makerFeeRate: zodDecimal(),
  takerFeeRate: zodDecimal(),
  builderFeeRate: zodDecimal(),
})

export const FeesResponseSchema = z.object({ data: z.array(FeesSchema) })

export type Fees = z.infer<typeof FeesSchema>
