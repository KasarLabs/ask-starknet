import { get_order_msg as wasmLibGetOrderMsgHash } from '@x10xchange/stark-crypto-wrapper-wasm'

import { type StarknetDomain } from '../../api/starknet.schema.ts'
import { type OrderSide } from '../../models/order.types.ts'
import { fromHexString, toHexString, type HexString } from '../hex.ts'
import { type Decimal, type Long } from '../number.ts'
import { calcStarknetExpiration } from './calc-starknet-expiration.ts'
import { jsGetOrderMsgHash } from './js/js-get-order-msg-hash.ts'

type GetStarknetOrderMsgHashArgs = {
  side: OrderSide
  nonce: Long
  assetIdCollateral: Decimal
  assetIdSynthetic: Decimal
  collateralAmountStark: Long
  feeStark: Long
  syntheticAmountStark: Long
  expiryEpochMillis: number
  vaultId: Long
  starkPublicKey: HexString
  starknetDomain: StarknetDomain
}

export const getStarknetOrderMsgHash = (args: GetStarknetOrderMsgHashArgs) => {
  const isBuyingSynthetic = args.side === 'BUY'
  const expirationTimestamp = calcStarknetExpiration(args.expiryEpochMillis)

  const [amountCollateral, amountSynthetic] = isBuyingSynthetic
    ? [args.collateralAmountStark.negated(), args.syntheticAmountStark]
    : [args.collateralAmountStark, args.syntheticAmountStark.negated()]

  const getOrderHashArgs = [
    /* position_id         */ args.vaultId.toString(),
    /* base_asset_id_hex   */ toHexString(args.assetIdSynthetic.toString(16)),
    /* base_amount         */ amountSynthetic.toString(10),
    /* quote_asset_id_hex  */ toHexString(args.assetIdCollateral.toString(16)),
    /* quote_amount        */ amountCollateral.toString(10),
    /* fee_asset_id_hex    */ toHexString(args.assetIdCollateral.toString(16)),
    /* fee_amount          */ args.feeStark.toString(10),
    /* expiration          */ expirationTimestamp.toString(10),
    /* salt                */ args.nonce.toString(10),
    /* user_public_key_hex */ args.starkPublicKey,
    /* domain_name         */ args.starknetDomain.name,
    /* domain_version      */ args.starknetDomain.version,
    /* domain_chain_id     */ args.starknetDomain.chainId,
    /* domain_revision     */ args.starknetDomain.revision.toString(),
  ] as const

  try {
    const wasmHash = wasmLibGetOrderMsgHash(...getOrderHashArgs)

    return fromHexString(wasmHash as HexString)
  } catch {
    const jsHash = jsGetOrderMsgHash(...getOrderHashArgs)

    return fromHexString(jsHash as HexString)
  }
}
