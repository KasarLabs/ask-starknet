import { parse } from 'json-custom-numbers'

import { Long } from './number.ts'

function numberParser(_k: string | number | undefined, s: string) {
  const n = +s

  if (n >= Number.MIN_SAFE_INTEGER && n <= Number.MAX_SAFE_INTEGER) {
    return n
  }

  if (s.indexOf('.') !== -1 || s.indexOf('e') !== -1 || s.indexOf('E') !== -1) {
    return n
  }

  return Long(s)
}

export const parseJsonWithBigNumber = (data: string) => {
  return parse(data, undefined, numberParser)
}
