import { beforeAll } from 'vitest'

import { tryInitWasm } from './src/utils/wasm.ts'

beforeAll(async () => {
  await tryInitWasm()
})
