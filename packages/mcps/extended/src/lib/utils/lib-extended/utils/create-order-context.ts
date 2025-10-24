import { type Fees } from '../api/fees.schema.js';
import { type Market } from '../api/markets.schema.js';
import { type StarknetDomain } from '../api/starknet.schema.js';
import { type OrderContext } from '../models/order.types.js';
import { type HexString } from './hex.js';
import { Decimal, Long } from './number.js';

export const createOrderContext = ({
  market,
  fees,
  starknetDomain,
  vaultId,
  starkPrivateKey,
  builderId,
  builderFee,
}: {
  market: Market;
  fees: Fees;
  starknetDomain: StarknetDomain;
  vaultId: string;
  starkPrivateKey: HexString;
  builderId?: Long;
  builderFee?: Decimal;
}): OrderContext => ({
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
});
