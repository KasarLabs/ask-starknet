import { z } from 'zod/v4'

import { type HexString, isHexString } from './hex.js'
import { invariant } from './invariant.js'
import { Decimal, Long } from './number.js'

export const zodDecimal = () =>
  z.string().transform((value): Decimal => Decimal(value))

export const zodLong = () =>
  z.unknown().transform((value): Long => {
    const isLong = Long.isBigNumber(value)

    invariant(
      isLong || typeof value === 'number' || typeof value === 'string',
      '`value` must be `Long`, `number` or `string`',
    )

    return (isLong ? value : Long(value)) as Long
  })

export const zodHexString = () =>
  z.string().transform((value): HexString => {
    invariant(isHexString(value), '`value` must be a hex string')

    return value as HexString
  })
