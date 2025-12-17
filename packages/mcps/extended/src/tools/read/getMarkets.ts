import { ExtendedApiEnv, ExtendedApiResponse } from '../../lib/types/index.js';
import { apiGet } from '../../lib/utils/api.js';
import { GetMarketsSchema } from '../../schemas/index.js';

export interface MarketStats {
  dailyVolume: string;
  dailyVolumeBase: string;
  dailyPriceChangePercentage: string;
  dailyLow: string;
  dailyHigh: string;
  lastPrice: string;
  askPrice: string;
  bidPrice: string;
  markPrice: string;
  indexPrice: string;
  fundingRate: string;
  nextFundingRate: number;
  openInterest: string;
  openInterestBase: string;
}

export interface TradingConfig {
  minOrderSize: string;
  minOrderSizeChange: string;
  minPriceChange: string;
  maxMarketOrderValue: string;
  maxLimitOrderValue: string;
  maxPositionValue: string;
  maxLeverage: string;
  maxNumOrders: string;
  limitPriceCap: string;
  limitPriceFloor: string;
}

export interface L2Config {
  type: string;
  collateralId: string;
  collateralResolution: number;
  syntheticId: string;
  syntheticResolution: number;
}

export interface MarketInfo {
  name: string;
  assetName: string;
  assetPrecision: number;
  collateralAssetName: string;
  collateralAssetPrecision: number;
  active: boolean;
  status: 'ACTIVE' | 'REDUCE_ONLY' | 'DELISTED' | 'PRELISTED' | 'DISABLED';
  marketStats: MarketStats;
  tradingConfig: TradingConfig;
  l2Config: L2Config;
}

export const getMarkets = async (
  env: ExtendedApiEnv,
  params: GetMarketsSchema
): Promise<ExtendedApiResponse<MarketInfo[]>> => {
  try {
    // Build query string if markets are specified
    let endpoint = '/api/v1/info/markets';
    if (params.markets && params.markets.length > 0) {
      const queryParams = params.markets.map((m) => `market=${m}`).join('&');
      endpoint = `${endpoint}?${queryParams}`;
    }

    const response = await apiGet<MarketInfo[]>(
      env,
      endpoint,
      false // Public endpoint, no auth required
    );

    return {
      status: 'success',
      data: response,
    };
  } catch (error: any) {
    console.error('Error getting markets:', error);
    return {
      status: 'failure',
      error: error.message || 'Failed to get markets',
    };
  }
};
