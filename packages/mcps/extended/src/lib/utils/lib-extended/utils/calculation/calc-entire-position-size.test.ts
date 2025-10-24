import { expect, test } from 'vitest'

import { Decimal } from '../number.js'
import { calcEntirePositionSize } from './calc-entire-position-size.js'

test('calc entire position size', () => {
  expect(
    calcEntirePositionSize(Decimal(24580.3412), Decimal(0.0001), Decimal(10000000)),
  ).toEqual(Decimal(20341.4588))
})
