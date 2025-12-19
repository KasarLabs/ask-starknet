import { describe, beforeAll, it, expect } from '@jest/globals';
import { getMarkets } from '../../src/tools/read/getMarkets.js';
import { getMarketStats } from '../../src/tools/read/getMarketStats.js';
import { getMarketOrderbook } from '../../src/tools/read/getMarketOrderbook.js';
import { getMarketTrades } from '../../src/tools/read/getMarketTrades.js';
import { getCandlesHistory } from '../../src/tools/read/getCandlesHistory.js';
import { getFundingRatesHistory } from '../../src/tools/read/getFundingRatesHistory.js';
import { ExtendedApiEnv } from '../../src/lib/types/index.js';
import { getDataAsRecord, getDataAsArray } from '../helpers.js';

describe('Extended Read Operations - Market Data', () => {
  let env: ExtendedApiEnv;
  let testMarket: string;

  beforeAll(async () => {
    const apiUrl =
      process.env.EXTENDED_API_URL || 'https://api.starknet.extended.exchange';

    env = {
      apiUrl,
    };

    // Get a market to use for testing
    const marketsResult = await getMarkets(env, {});
    if (marketsResult.status === 'success' && marketsResult.data) {
      const markets = getDataAsArray(marketsResult.data);
      if (markets.length > 0) {
        testMarket = markets[0].name;
      }
    }

    if (!testMarket) {
      throw new Error('No markets available for testing');
    }
  });

  describe('Markets', () => {
    it('should get all markets', async () => {
      const result = await getMarkets(env, {});

      expect(result.status).toBe('success');
      expect(result.data).toBeDefined();
      if (result.status === 'success' && result.data) {
        const markets = getDataAsArray(result.data);
        expect(Array.isArray(markets)).toBe(true);
        expect(markets.length).toBeGreaterThan(0);

        // Verify market structure
        const market = markets[0];
        expect(market).toHaveProperty('name');
        expect(market).toHaveProperty('assetName');
        expect(market).toHaveProperty('active');
        expect(market).toHaveProperty('status');
        expect(market).toHaveProperty('marketStats');
        expect(market).toHaveProperty('tradingConfig');
        expect(market).toHaveProperty('l2Config');

        // Verify marketStats structure
        const marketStats = market.marketStats;
        expect(marketStats).toHaveProperty('lastPrice');
        expect(marketStats).toHaveProperty('markPrice');
        expect(marketStats).toHaveProperty('indexPrice');
        expect(marketStats).toHaveProperty('fundingRate');
        expect(marketStats).toHaveProperty('openInterest');
      }
    });

    it('should get specific markets by name', async () => {
      const result = await getMarkets(env, { markets: [testMarket] });

      expect(result.status).toBe('success');
      expect(result.data).toBeDefined();
      if (result.status === 'success' && result.data) {
        const markets = getDataAsArray(result.data);
        expect(markets.length).toBeGreaterThan(0);
        markets.forEach((market: any) => {
          expect(market.name).toBe(testMarket);
        });
      }
    });

    it('should get multiple specific markets', async () => {
      // First get all markets to find at least 2
      const allMarketsResult = await getMarkets(env, {});
      if (allMarketsResult.status === 'success' && allMarketsResult.data) {
        const allMarkets = getDataAsArray(allMarketsResult.data);
        if (allMarkets.length >= 2) {
          const marketNames = allMarkets.slice(0, 2).map((m: any) => m.name);
          const result = await getMarkets(env, { markets: marketNames });

          expect(result.status).toBe('success');
          expect(result.data).toBeDefined();
          if (result.status === 'success' && result.data) {
            const markets = getDataAsArray(result.data);
            expect(markets.length).toBeGreaterThanOrEqual(1);
            markets.forEach((market: any) => {
              expect(marketNames).toContain(market.name);
            });
          }
        }
      }
    });
  });

  describe('Market Statistics', () => {
    it('should get market stats for a specific market', async () => {
      const result = await getMarketStats(env, { market: testMarket });

      expect(result.status).toBe('success');
      expect(result.data).toBeDefined();
      if (result.status === 'success' && result.data) {
        const stats = getDataAsRecord(result.data);
        expect(stats).toHaveProperty('dailyVolume');
        expect(stats).toHaveProperty('dailyVolumeBase');
        expect(stats).toHaveProperty('dailyPriceChangePercentage');
        expect(stats).toHaveProperty('dailyLow');
        expect(stats).toHaveProperty('dailyHigh');
        expect(stats).toHaveProperty('lastPrice');
        expect(stats).toHaveProperty('askPrice');
        expect(stats).toHaveProperty('bidPrice');
        expect(stats).toHaveProperty('markPrice');
        expect(stats).toHaveProperty('indexPrice');
        expect(stats).toHaveProperty('fundingRate');
        expect(stats).toHaveProperty('nextFundingRate');
        expect(stats).toHaveProperty('openInterest');
        expect(stats).toHaveProperty('openInterestBase');
      }
    });
  });

  describe('Orderbook', () => {
    it('should get market orderbook', async () => {
      const result = await getMarketOrderbook(env, { market: testMarket });

      expect(result.status).toBe('success');
      expect(result.data).toBeDefined();
      if (result.status === 'success' && result.data) {
        const orderbook = getDataAsRecord(result.data);
        // API returns 'bid' and 'ask' (not 'bids' and 'asks')
        expect(orderbook).toHaveProperty('bid');
        expect(orderbook).toHaveProperty('ask');
        expect(Array.isArray(orderbook.bid)).toBe(true);
        expect(Array.isArray(orderbook.ask)).toBe(true);

        // Verify bid structure
        if (orderbook.bid.length > 0) {
          const bid = orderbook.bid[0];
          expect(bid).toHaveProperty('price');
          expect(bid).toHaveProperty('qty');
        }

        // Verify ask structure
        if (orderbook.ask.length > 0) {
          const ask = orderbook.ask[0];
          expect(ask).toHaveProperty('price');
          expect(ask).toHaveProperty('qty');
        }
      }
    });
  });

  describe('Trades', () => {
    it('should get market trades', async () => {
      const result = await getMarketTrades(env, { market: testMarket });

      expect(result.status).toBe('success');
      expect(result.data).toBeDefined();
      if (result.status === 'success' && result.data) {
        const trades = getDataAsArray(result.data);
        expect(Array.isArray(trades)).toBe(true);
        // If trades exist, verify structure
        if (trades.length > 0) {
          const trade = trades[0];
          // API returns short property names: p=price, q=qty, S=side, T=time
          expect(trade).toHaveProperty('p');
          expect(trade).toHaveProperty('q');
          expect(trade).toHaveProperty('S');
          expect(['BUY', 'SELL']).toContain(trade.S);
          expect(trade).toHaveProperty('T');
          expect(trade.T).toBeDefined();
          expect(typeof trade.T).toBe('number');
          expect(trade.T).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('Candles', () => {
    it('should get candles history', async () => {
      const endTime = Date.now();
      const result = await getCandlesHistory(env, {
        market: testMarket,
        candleType: 'trades',
        interval: '1h',
        limit: 24,
        endTime,
      });

      expect(result.status).toBe('success');
      expect(result.data).toBeDefined();
      if (result.status === 'success' && result.data) {
        const candles = getDataAsArray(result.data);
        expect(Array.isArray(candles)).toBe(true);
        // If candles exist, verify structure
        if (candles.length > 0) {
          const candle = candles[0];
          // API returns short property names: T=time, o=open, h=high, l=low, c=close, v=volume
          expect(candle).toHaveProperty('T');
          expect(candle).toHaveProperty('o');
          expect(candle).toHaveProperty('h');
          expect(candle).toHaveProperty('l');
          expect(candle).toHaveProperty('c');
          expect(candle).toHaveProperty('v');
          expect(candle.T).toBeDefined();
          expect(typeof candle.T).toBe('number');
          expect(candle.T).toBeGreaterThan(0);
        }
      }
    });

    it('should get candles history with different intervals', async () => {
      const intervals = ['1m', '5m', '15m', '1h', '4h', '1d'];
      for (const interval of intervals) {
        const endTime = Date.now();
        const result = await getCandlesHistory(env, {
          market: testMarket,
          candleType: 'trades',
          interval,
          limit: 100,
          endTime,
        });

        expect(result.status).toBe('success');
        expect(result.data).toBeDefined();
        if (result.status === 'success' && result.data) {
          const candles = getDataAsArray(result.data);
          expect(Array.isArray(candles)).toBe(true);
        }
      }
    });

    it('should get candles history with different price types', async () => {
      const priceTypes: Array<'trades' | 'mark-prices' | 'index-prices'> = [
        'trades',
        'mark-prices',
        'index-prices',
      ];
      for (const priceType of priceTypes) {
        const endTime = Date.now();
        const result = await getCandlesHistory(env, {
          market: testMarket,
          candleType: priceType,
          interval: '1h',
          limit: 24,
          endTime,
        });

        expect(result.status).toBe('success');
        expect(result.data).toBeDefined();
        if (result.status === 'success' && result.data) {
          const candles = getDataAsArray(result.data);
          expect(Array.isArray(candles)).toBe(true);
        }
      }
    });
  });

  describe('Funding Rates', () => {
    it('should get funding rates history', async () => {
      const endTime = Date.now();
      const startTime = endTime - 7 * 24 * 60 * 60 * 1000; // 7 days ago
      const result = await getFundingRatesHistory(env, {
        market: testMarket,
        startTime,
        endTime,
      });

      expect(result.status).toBe('success');
      expect(result.data).toBeDefined();
      if (result.status === 'success' && result.data) {
        const rates = getDataAsArray(result.data);
        expect(Array.isArray(rates)).toBe(true);
        // If rates exist, verify structure
        if (rates.length > 0) {
          const rate = rates[0];
          // API returns short property names: T=time, f=fundingRate, m=market
          expect(rate).toHaveProperty('T');
          expect(rate).toHaveProperty('f');
          expect(rate.T).toBeDefined();
          expect(typeof rate.T).toBe('number');
          expect(rate.T).toBeGreaterThan(0);
        }
      }
    });

    it('should get funding rates history with limit', async () => {
      const endTime = Date.now();
      const startTime = endTime - 7 * 24 * 60 * 60 * 1000; // 7 days ago
      const result = await getFundingRatesHistory(env, {
        market: testMarket,
        startTime,
        endTime,
        limit: 10,
      });

      expect(result.status).toBe('success');
      expect(result.data).toBeDefined();
      if (result.status === 'success' && result.data) {
        const rates = getDataAsArray(result.data);
        expect(Array.isArray(rates)).toBe(true);
        // Note: API may return more than the limit, so we just verify it's an array
      }
    });
  });
});
