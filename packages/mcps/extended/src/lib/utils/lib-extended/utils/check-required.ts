import { isNil } from 'lodash-es'

export function checkRequired<T>(value: T, name: string) {
  if (isNil(value)) {
    throw new Error(`\`${name}\` is required`)
  }

  return value as NonNullable<T>
}
