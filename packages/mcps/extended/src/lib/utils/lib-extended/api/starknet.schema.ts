import { z } from 'zod/v4'

export const StarknetDomainSchema = z.object({
  name: z.string(),
  version: z.string(),
  chainId: z.string(),
  revision: z.number(),
})

export const StarknetDomainResponseSchema = z.object({ data: StarknetDomainSchema })

export type StarknetDomain = z.infer<typeof StarknetDomainSchema>
