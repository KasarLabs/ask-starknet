import type { get_transfer_msg as wasmGetTransferMsgHash } from '@x10xchange/stark-crypto-wrapper-wasm'
import { hash as starkHash, selector as starkSelector } from 'starknet'

import { jsGetObjMsgHash } from './js-get-obj-msg-hash.ts'
import { jsGetStarknetDomainObjHash } from './js-get-starknet-domain-obj-hash.ts'

export const jsGetTransferMsgHash = (
  ...args: Parameters<typeof wasmGetTransferMsgHash>
) => {
  const [
    recipientPositionId,
    senderPositionId,
    collateralIdHex,
    amount,
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

  const transferSelector = starkSelector.getSelector(
    '"TransferArgs"("recipient":"PositionId","position_id":"PositionId","collateral_id":"AssetId","amount":"u64","expiration":"Timestamp","salt":"felt")"PositionId"("value":"u32")"AssetId"("value":"felt")"Timestamp"("seconds":"u64")',
  )
  const transferHash = starkHash.computePoseidonHashOnElements([
    transferSelector,
    recipientPositionId,
    senderPositionId,
    collateralIdHex,
    amount,
    expiration,
    salt,
  ])

  return jsGetObjMsgHash(domainHash, userPublicKeyHex, transferHash)
}
