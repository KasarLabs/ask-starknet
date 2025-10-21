import { addDays } from 'date-fns'

import { generateNonce } from '../utils/generate-nonce.ts'
import { getAccountById } from '../utils/get-account-by-id.ts'
import { Long, type Decimal } from '../utils/number.ts'
import { TransferSettlement } from './transfer-settlement.ts'
import { type TransferContext } from './transfer.types.ts'

const TRANSFER_EXPIRATION_DAYS = 7

type TransferCollateral = 'USD'

export class Transfer {
  private readonly fromAccountId: Long
  private readonly toAccountId: Long
  private readonly amount: Decimal
  private readonly transferredAsset: TransferCollateral
  private readonly settlement: TransferSettlement

  private constructor({
    fromAccountId,
    toAccountId,
    amount,
    transferredAsset,
    settlement,
  }: {
    fromAccountId: Long
    toAccountId: Long
    amount: Decimal
    transferredAsset: TransferCollateral
    settlement: TransferSettlement
  }) {
    this.fromAccountId = fromAccountId
    this.toAccountId = toAccountId
    this.amount = amount
    this.transferredAsset = transferredAsset
    this.settlement = settlement
  }

  toJSON() {
    return {
      fromAccount: this.fromAccountId.toString(10),
      toAccount: this.toAccountId.toString(10),
      amount: this.amount.toString(10),
      transferredAsset: this.transferredAsset,
      settlement: this.settlement.toJSON(),
    }
  }

  static create({
    fromAccountId,
    toAccountId,
    amount,
    transferredAsset,
    ctx,
  }: {
    fromAccountId: Long
    toAccountId: Long
    amount: Decimal
    transferredAsset: TransferCollateral
    ctx: TransferContext
  }) {
    const fromAccount = getAccountById(ctx.accounts, fromAccountId)
    const toAccount = getAccountById(ctx.accounts, toAccountId)

    const expiryEpochMillis = addDays(new Date(), TRANSFER_EXPIRATION_DAYS).getTime()
    const starkAmount = amount.times(ctx.collateralResolution).integerValue()

    return new Transfer({
      fromAccountId,
      toAccountId,
      amount,
      transferredAsset,
      settlement: TransferSettlement.create({
        amount: starkAmount,
        assetId: ctx.collateralId,
        expiryEpochMillis,
        nonce: Long(generateNonce()),
        receiverPositionId: Long(toAccount.l2Vault),
        receiverPublicKey: toAccount.l2Key,
        senderPositionId: Long(fromAccount.l2Vault),
        senderPublicKey: fromAccount.l2Key,
        starkPrivateKey: ctx.starkPrivateKey,
        starknetDomain: ctx.starknetDomain,
      }),
    })
  }
}
