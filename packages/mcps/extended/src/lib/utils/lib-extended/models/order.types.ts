import type { StarknetDomain } from '../api/starknet.schema.js';
import type { HexString } from '../utils/hex.js';
import { type Decimal, type Long } from '../utils/number.js';

export type OrderSide = 'BUY' | 'SELL';
export type OrderType = 'LIMIT' | 'MARKET' | 'TPSL';
export type OrderTimeInForce = 'GTT' | 'IOC' | 'FOK';
export type OrderTpSlType = 'ORDER' | 'POSITION';
export type OrderTriggerPriceType = 'MARK' | 'INDEX' | 'LAST';
export type OrderPriceType = 'LIMIT' | 'MARKET';

export type SettlementSignature = { r: string; s: string };
export type OrderContext = {
  assetIdCollateral: Decimal;
  assetIdSynthetic: Decimal;
  settlementResolutionCollateral: Decimal;
  settlementResolutionSynthetic: Decimal;
  minOrderSizeChange: Decimal;
  maxPositionValue: Decimal;
  feeRate: Decimal;
  vaultId: Long;
  starkPrivateKey: HexString;
  starknetDomain: StarknetDomain;
  builderId?: Long;
  builderFee?: Decimal;
};
