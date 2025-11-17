import { Decimal, Long } from '../utils/lib-extended/index.js';

export interface ExtendedApiEnv {
  apiKey?: string | undefined;
  apiUrl: string;
  privateKey?: string | undefined;
  builderParams?: {
    builderId: Long;
    builderFee: Decimal;
  };
}

export interface ExtendedApiResponse<T = any> {
  status: 'success' | 'failure';
  data?: T;
  error?: string;
}

// Market data types
export interface Market {
  market_id: string;
  symbol: string;
  base_currency: string;
  quote_currency: string;
  price_precision: number;
  quantity_precision: number;
  min_order_size: string;
  max_order_size: string;
  tick_size: string;
}

// Balance types
export interface Balance {
  collateralName: string;
  balance: string;
  equity: string;
  availableForTrade: string;
  availableForWithdrawal: string;
  unrealisedPnl: string;
  initialMargin: string;
  marginRatio: string;
  updatedTime: number;
  exposure: string;
  leverage: string;
}

// Position types
export interface Position {
  id: number;
  accountId: number;
  market: string;
  side: 'LONG' | 'SHORT';
  leverage: string;
  size: string;
  value: string;
  openPrice: string;
  markPrice: string;
  liquidationPrice: string;
  margin: string;
  unrealisedPnl: string;
  realisedPnl: string;
  tpTriggerPrice?: string;
  tpLimitPrice?: string;
  slTriggerPrice?: string;
  slLimitPrice?: string;
  adl: number;
  createdAt: number;
  updatedAt: number;
}

// Order types
export type OrderType = 'LIMIT' | 'MARKET';
export type OrderSide = 'BUY' | 'SELL';
export type OrderStatus =
  | 'NEW'
  | 'PARTIALLY_FILLED'
  | 'FILLED'
  | 'CANCELED'
  | 'REJECTED';
export type TimeInForce = 'GTC' | 'IOC' | 'FOK' | 'GTT';

export interface OrderReturn {
  id: number;
  accountId: number;
  externalId: string;
  market: string;
  type: OrderType;
  side: OrderSide;
  status: OrderStatus;
  price: string;
  averagePrice?: string;
  qty: string;
  filledQty: string;
  payedFee: string;
  reduceOnly: boolean;
  postOnly: boolean;
  createdTime: number;
  updatedTime: number;
  expireTime?: number;
}

// Trade types
export interface Trade {
  id: number;
  accountId: number;
  market: string;
  orderId: number;
  externalOrderId: string;
  side: OrderSide;
  price: string;
  qty: string;
  value: string;
  fee: string;
  tradeType: string;
  createdTime: number;
  isTaker: boolean;
}

// Leverage types
export interface LeverageSetting {
  market_id: string;
  leverage: string;
}

// Fee types
export interface FeeSchedule {
  maker_fee: string;
  taker_fee: string;
  margin_fee: string;
}

// Account info types
export interface AccountInfo {
  status: string;
  l2Key: string;
  l2Vault: string;
  accountId: string;
  description: string;
  bridgeStarknetAddress: string;
}
