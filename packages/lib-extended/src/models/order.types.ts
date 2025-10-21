import type { StarknetDomain } from '../api/starknet.schema.ts'
import type { HexString } from '../utils/hex.ts'
import { type Decimal, type Long } from '../utils/number.ts'

export type OrderSide = 'BUY' | 'SELL'
export type OrderType = 'LIMIT' | 'MARKET' | 'TPSL'
export type OrderTimeInForce = 'GTT' | 'IOC'
export type OrderTpSlType = 'ORDER' | 'POSITION'
export type OrderTriggerPriceType = 'MARK' | 'INDEX' | 'LAST'
export type OrderPriceType = 'LIMIT'

export type SettlementSignature = { r: string; s: string }
export type OrderContext = {
  assetIdCollateral: Decimal
  assetIdSynthetic: Decimal
  settlementResolutionCollateral: Decimal
  settlementResolutionSynthetic: Decimal
  minOrderSizeChange: Decimal
  maxPositionValue: Decimal
  feeRate: Decimal
  vaultId: Long
  starkPrivateKey: HexString
  starknetDomain: StarknetDomain
  builderId?: Long
  builderFee?: Decimal
}
