import { GetLstStatsSchema } from '../../schemas/index.js';
import { onchainRead, toolResult } from '@kasarlabs/ask-starknet-core';

interface LstStatsResponse {
  asset: string;
  assetAddress: string;
  lstAddress: string;
  tvlUsd: number;
  tvlAsset: number;
  apy: number;
  apyInPercentage: string;
  exchangeRate: number;
  preciseExchangeRate: string;
}

export const getLstStats = async (
  env: onchainRead | null,
  params: GetLstStatsSchema
): Promise<toolResult> => {
  // This tool doesn't require onchain access, it only uses HTTP API
  try {
    const apiUrl = 'https://app.endur.fi/api/lst/stats';

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'EndurfiMCP/1.0',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `API request failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const statsData = (await response.json()) as LstStatsResponse[];

    // Format the data for better readability
    const formattedStats = statsData.map((stat) => ({
      asset: stat.asset,
      asset_address: stat.assetAddress,
      lst_address: stat.lstAddress,
      tvl_usd: stat.tvlUsd,
      tvl_usd_formatted: `$${stat.tvlUsd.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      tvl_asset: stat.tvlAsset,
      apy: stat.apy,
      apy_percentage: stat.apyInPercentage,
      exchange_rate: stat.exchangeRate,
      precise_exchange_rate: stat.preciseExchangeRate,
    }));

    // Sort by APY descending to show the highest yields first
    const sortedStats = formattedStats.sort((a, b) => b.apy - a.apy);

    return {
      status: 'success',
      data: {
        stats: sortedStats,
        summary: {
          total_assets: statsData.length,
          highest_apy: sortedStats[0]
            ? {
                asset: sortedStats[0].asset,
                apy: sortedStats[0].apy,
                apy_percentage: sortedStats[0].apy_percentage,
              }
            : null,
        },
        description:
          'Liquid staking token statistics (APY, exchange rate, TVL) for all supported tokens on Endur.fi',
      },
    };
  } catch (error: any) {
    return {
      status: 'failure',
      error: error.message || 'Unknown error getting LST stats',
    };
  }
};
