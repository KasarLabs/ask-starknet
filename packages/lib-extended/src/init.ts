import dotenv from 'dotenv'

import { setApiKey, setHost } from './api/axios.ts'
import { isHexString } from './utils/hex.ts'
import { invariant } from './utils/invariant.ts'
import { tryInitWasm } from './utils/wasm.ts'

export const init = async () => {
  await tryInitWasm()

  dotenv.config({ path: ['.env.local'] })

  invariant(process.env.API_HOST, 'API_HOST is not set')
  invariant(process.env.API_KEY, 'API_KEY is not set')
  invariant(process.env.STARK_PRIVATE_KEY, 'STARK_PRIVATE_KEY is not set')
  invariant(process.env.VAULT_ID, 'VAULT_ID is not set')
  invariant(
    isHexString(process.env.STARK_PRIVATE_KEY),
    'STARK_PRIVATE_KEY must be a hex string',
  )

  setHost(process.env.API_HOST)
  setApiKey(process.env.API_KEY)

  return {
    apiKey: process.env.API_KEY,
    starkPrivateKey: process.env.STARK_PRIVATE_KEY,
    vaultId: process.env.VAULT_ID,
  }
}
