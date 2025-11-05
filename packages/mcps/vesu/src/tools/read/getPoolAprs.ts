import { formatUnits } from 'ethers';
import { GetPoolAprsSchema } from '../../schemas/index.js';

interface MarketStats {
  supplyApy: {
    value: string;
    decimals: number;
  };
  lstApr: {
    value: string | null;
    decimals: number;
  } | null;
  defiSpringSupplyApr: {
    value: string | null;
    decimals: number;
  } | null;
}

interface Market {
  pool: {
    id: string;
    name: string;
  };
  symbol: string;
  name: string;
  stats: MarketStats;
}

interface MarketsResponse {
  data: Market[];
}

export const getPoolAprs = async (params: GetPoolAprsSchema) => {
  try {
    const apiUrl = 'https://api.vesu.xyz/markets';

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'VesuMCP/1.0',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `API request failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const marketsData = (await response.json()) as MarketsResponse;
    const markets = marketsData.data;

    // Calculate total APR for each pool
    const poolAprs = markets.map((market) => {
      const { stats } = market;
      const decimals = 18; // All APR values use 18 decimals

      // Parse values as BigInt, handling null values
      const supplyApyValue = BigInt(stats.supplyApy.value);
      const lstAprValue = stats.lstApr?.value
        ? BigInt(stats.lstApr.value)
        : 0n;
      const defiSpringSupplyAprValue = stats.defiSpringSupplyApr?.value
        ? BigInt(stats.defiSpringSupplyApr.value)
        : 0n;

      // Calculate total APR
      const totalAprValue = supplyApyValue + lstAprValue + defiSpringSupplyAprValue;

      // Format with formatUnits
      const totalApr = formatUnits(totalAprValue, decimals);

      // Format individual components for reference
      const supplyApy = formatUnits(supplyApyValue, decimals);
      const lstApr = stats.lstApr?.value
        ? formatUnits(lstAprValue, decimals)
        : null;
      const defiSpringSupplyApr = stats.defiSpringSupplyApr?.value
        ? formatUnits(defiSpringSupplyAprValue, decimals)
        : null;

      return {
        pool_id: market.pool.id,
        pool_name: market.pool.name,
        token_symbol: market.symbol,
        token_name: market.name,
        total_apr: totalApr,
        total_apr_percentage: (parseFloat(totalApr) * 100).toFixed(4) + '%',
        components: {
          supply_apy: supplyApy,
          supply_apy_percentage: (parseFloat(supplyApy) * 100).toFixed(4) + '%',
          lst_apr: lstApr,
          lst_apr_percentage: lstApr
            ? (parseFloat(lstApr) * 100).toFixed(4) + '%'
            : null,
          defi_spring_supply_apr: defiSpringSupplyApr,
          defi_spring_supply_apr_percentage: defiSpringSupplyApr
            ? (parseFloat(defiSpringSupplyApr) * 100).toFixed(4) + '%'
            : null,
        },
      };
    });

    // Sort by total APR descending to show the highest yields first
    const sortedPoolAprs = poolAprs.sort(
      (a, b) => parseFloat(b.total_apr) - parseFloat(a.total_apr)
    );

    return {
      status: 'success',
      data: {
        pools: sortedPoolAprs,
        summary: {
          total_pools: sortedPoolAprs.length,
          highest_apr: sortedPoolAprs[0]
            ? {
                pool_name: sortedPoolAprs[0].pool_name,
                token_symbol: sortedPoolAprs[0].token_symbol,
                total_apr: sortedPoolAprs[0].total_apr,
                total_apr_percentage: sortedPoolAprs[0].total_apr_percentage,
              }
            : null,
        },
        description:
          'Supply APR for all pools on Vesu protocol. Total APR = Supply APY + LST APR + DeFi Spring Supply APR',
      },
    };
  } catch (error: any) {
    return {
      status: 'failure',
      error: error.message || 'Unknown error getting pool APRs',
    };
  }
};


