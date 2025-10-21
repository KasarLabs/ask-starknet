import { sign_message as wasmLibSignMessage } from '@x10xchange/stark-crypto-wrapper-wasm'
import { ec as starkEc } from 'starknet'

import { fromHexString, type HexString } from '../hex.ts'
import { getStarkPublicKey } from './get-stark-public-key.ts'

const wasmSignMessage = (
  messageHash: string,
  starkPrivateKey: HexString,
  starkPublicKey: string,
) => {
  const signature = wasmLibSignMessage(starkPrivateKey, messageHash)
  const result = {
    signature: {
      r: fromHexString(signature.r as HexString),
      s: fromHexString(signature.s as HexString),
    },
    starkKey: starkPublicKey,
  }
  // See this thread for the reason why we need to free the memory:
  // https://stackoverflow.com/questions/73655844/when-should-i-call-the-free-methods-generated-by-wasm-pack
  signature.free()

  return result
}

const jsSignMessage = (
  messageHash: string,
  starkPrivateKey: HexString,
  starkPublicKey: string,
) => {
  const signature = starkEc.starkCurve.sign(messageHash, starkPrivateKey)

  return {
    signature: {
      r: signature.r.toString(16),
      s: signature.s.toString(16),
    },
    starkKey: starkPublicKey,
  }
}

export const signMessage = (messageHash: string, starkPrivateKey: HexString) => {
  const starkPublicKey = getStarkPublicKey(starkPrivateKey)

  try {
    return wasmSignMessage(messageHash, starkPrivateKey, starkPublicKey)
  } catch {
    return jsSignMessage(messageHash, starkPrivateKey, starkPublicKey)
  }
}
