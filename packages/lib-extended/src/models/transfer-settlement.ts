import { type StarknetDomain } from '../api/starknet.schema.ts'
import { type HexString } from '../utils/hex.ts'
import { type Long } from '../utils/number.ts'
import { calcStarknetExpiration } from '../utils/signing/calc-starknet-expiration.ts'
import { getStarknetTransferMsgHash } from '../utils/signing/get-transfer-msg-hash.ts'
import { signMessage } from '../utils/signing/sign-message.ts'
import { type SettlementSignature } from './transfer.types.ts'

export class TransferSettlement {
  private readonly amount: Long
  private readonly assetId: HexString
  private readonly expirationTimestamp: number
  private readonly nonce: Long
  private readonly receiverPositionId: Long
  private readonly receiverPublicKey: HexString
  private readonly senderPositionId: Long
  private readonly senderPublicKey: HexString
  private readonly signature: SettlementSignature

  private constructor({
    amount,
    assetId,
    expirationTimestamp,
    nonce,
    receiverPositionId,
    receiverPublicKey,
    senderPositionId,
    senderPublicKey,
    signature,
  }: {
    amount: Long
    assetId: HexString
    expirationTimestamp: number
    nonce: Long
    receiverPositionId: Long
    receiverPublicKey: HexString
    senderPositionId: Long
    senderPublicKey: HexString
    signature: SettlementSignature
  }) {
    this.amount = amount
    this.assetId = assetId
    this.expirationTimestamp = expirationTimestamp
    this.nonce = nonce
    this.receiverPositionId = receiverPositionId
    this.receiverPublicKey = receiverPublicKey
    this.senderPositionId = senderPositionId
    this.senderPublicKey = senderPublicKey
    this.signature = signature
  }

  toJSON() {
    return {
      amount: this.amount.toString(10),
      assetId: this.assetId,
      expirationTimestamp: this.expirationTimestamp,
      nonce: this.nonce.toString(10),
      receiverPositionId: this.receiverPositionId,
      receiverPublicKey: this.receiverPublicKey,
      senderPositionId: this.senderPositionId,
      senderPublicKey: this.senderPublicKey,
      signature: this.signature,
    }
  }

  static create({
    amount,
    assetId,
    expiryEpochMillis,
    nonce,
    receiverPositionId,
    receiverPublicKey,
    senderPositionId,
    senderPublicKey,
    starkPrivateKey,
    starknetDomain,
  }: {
    amount: Long
    assetId: HexString
    expiryEpochMillis: number
    nonce: Long
    receiverPositionId: Long
    receiverPublicKey: HexString
    senderPositionId: Long
    senderPublicKey: HexString
    starkPrivateKey: HexString
    starknetDomain: StarknetDomain
  }) {
    const expirationTimestamp = calcStarknetExpiration(expiryEpochMillis)

    const transferHash = getStarknetTransferMsgHash({
      amount,
      assetId,
      expirationTimestamp,
      nonce,
      receiverPositionId,
      senderPositionId,
      senderPublicKey,
      starknetDomain,
    })

    const transferSignature = signMessage(transferHash, starkPrivateKey)

    return new TransferSettlement({
      amount,
      assetId,
      expirationTimestamp,
      nonce,
      receiverPositionId,
      receiverPublicKey,
      senderPositionId,
      senderPublicKey,
      signature: transferSignature.signature,
    })
  }
}
