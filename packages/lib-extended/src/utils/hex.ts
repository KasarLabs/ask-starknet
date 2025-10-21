import { invariant } from './invariant.ts'

export type HexString = `0x${string}`

export const isHexString = (value: string): value is HexString => {
  return value.substring(0, 2) === '0x'
}

export const toHexString = (value: string): HexString => {
  invariant(isHexString(value) !== true, 'Value is already a hex string')

  return `0x${value}`
}

export const fromHexString = (value: HexString): string => {
  invariant(isHexString(value) !== false, 'Value is not a hex string')

  return value.substring(2)
}
