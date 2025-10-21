import { type Fees } from '../api/fees.schema.ts'
import { type Market } from '../api/markets.schema.ts'
import { type StarknetDomain } from '../api/starknet.schema.ts'
import { type HexString } from './hex.ts'
import { Decimal, Long } from './number.ts'

export const createOrderContext = ({
  market,
  fees,
  starknetDomain,
  vaultId,
  starkPrivateKey,
  builderId,
  builderFee,
}: {
  market: Market
  fees: Fees
  starknetDomain: StarknetDomain
  vaultId: string
  starkPrivateKey: HexString
  builderId?: Long
  builderFee?: Decimal
}) => ({
  assetIdCollateral: Decimal(market.l2Config.collateralId, 16),
  assetIdSynthetic: Decimal(market.l2Config.syntheticId, 16),
  settlementResolutionCollateral: Decimal(market.l2Config.collateralResolution),
  settlementResolutionSynthetic: Decimal(market.l2Config.syntheticResolution),
  minOrderSizeChange: market.tradingConfig.minOrderSizeChange,
  maxPositionValue: market.tradingConfig.maxPositionValue,
  feeRate: Decimal.max(fees.makerFeeRate, fees.takerFeeRate),
  vaultId: Long(vaultId),
  starkPrivateKey,
  starknetDomain,
  builderId,
  builderFee,
})
