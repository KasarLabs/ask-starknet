import { ExtendedApiEnv, ExtendedApiResponse } from '../../lib/types/index.js';
import { apiGet } from '../../lib/utils/api.js';
import { GetMarketStatsSchema } from '../../schemas/index.js';
import { toolResult } from '@kasarlabs/ask-starknet-core';

export interface DeleverageLevel {
  level: number;
  rankingLowerBound: string;
}

export interface DeleverageLevels {
  shortPositions: DeleverageLevel[];
  longPositions: DeleverageLevel[];
}

export interface MarketStatsData {
  dailyVolume: string;
  dailyVolumeBase: string;
  dailyPriceChange: string;
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
  deleverageLevels: DeleverageLevels;
}

export const getMarketStats = async (
  env: ExtendedApiEnv,
  params: GetMarketStatsSchema
): Promise<ExtendedApiResponse<MarketStatsData>> => {
  try {
    const data = await apiGet<MarketStatsData>(
      env,
      `/api/v1/info/markets/${params.market}/stats`,
      false // Public endpoint, no auth required
    );

    return {
      status: 'success',
      data,
    };
  } catch (error: any) {
    console.error('Error getting market stats:', error);
    return {
      status: 'failure',
      error: error.message || 'Failed to get market stats',
    };
  }
};
