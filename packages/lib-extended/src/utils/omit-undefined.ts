import { isUndefined, omitBy } from 'lodash-es'

export const omitUndefined = (value: object) => omitBy(value, isUndefined)
