import type { get_order_msg as wasmGetOrderMsgHash } from '@x10xchange/stark-crypto-wrapper-wasm'
import { hash as starkHash, selector as starkSelector } from 'starknet'

import { jsGetObjMsgHash } from './js-get-obj-msg-hash.ts'
import { jsGetStarknetDomainObjHash } from './js-get-starknet-domain-obj-hash.ts'

export const jsGetOrderMsgHash = (...args: Parameters<typeof wasmGetOrderMsgHash>) => {
  const [
    positionId,
    baseAssetIdHex,
    baseAmount,
    quoteAssetIdHex,
    quoteAmount,
    feeAssetIdHex,
    feeAmount,
    expiration,
    salt,
    userPublicKeyHex,
    domainName,
    domainVersion,
    domainChainId,
    domainRevision,
  ] = args

  const domainHash = jsGetStarknetDomainObjHash({
    name: domainName,
    version: domainVersion,
    chainId: domainChainId,
    revision: parseInt(domainRevision),
  })

  const orderSelector = starkSelector.getSelector(
    '"Order"("position_id":"felt","base_asset_id":"AssetId","base_amount":"i64","quote_asset_id":"AssetId","quote_amount":"i64","fee_asset_id":"AssetId","fee_amount":"u64","expiration":"Timestamp","salt":"felt")"PositionId"("value":"u32")"AssetId"("value":"felt")"Timestamp"("seconds":"u64")',
  )
  const orderHash = starkHash.computePoseidonHashOnElements([
    orderSelector,
    positionId,
    baseAssetIdHex,
    baseAmount,
    quoteAssetIdHex,
    quoteAmount,
    feeAssetIdHex,
    feeAmount,
    expiration,
    salt,
  ])

  return jsGetObjMsgHash(domainHash, userPublicKeyHex, orderHash)
}
