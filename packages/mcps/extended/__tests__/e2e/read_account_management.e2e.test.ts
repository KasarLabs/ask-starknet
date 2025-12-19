import { describe, beforeAll, it, expect } from '@jest/globals';
import { getBalance } from '../../src/tools/read/getBalance.js';
import { getUserAccountInfo } from '../../src/tools/read/getUserAccountInfo.js';
import { getPositions } from '../../src/tools/read/getPositions.js';
import { getOpenOrders } from '../../src/tools/read/getOpenOrders.js';
import { getOrderById } from '../../src/tools/read/getOrderById.js';
import { getTradesHistory } from '../../src/tools/read/getTradesHistory.js';
import { getOrdersHistory } from '../../src/tools/read/getOrdersHistory.js';
import { getPositionsHistory } from '../../src/tools/read/getPositionsHistory.js';
import { getFundingPayments } from '../../src/tools/read/getFundingPayments.js';
import { getLeverage } from '../../src/tools/read/getLeverage.js';
import { getFees } from '../../src/tools/read/getFees.js';
import { ExtendedApiEnv } from '../../src/lib/types/index.js';
import { getDataAsRecord, getDataAsArray } from '../helpers.js';

describe('Extended Read Operations - Account Management', () => {
  let env: ExtendedApiEnv;

  beforeAll(() => {
    const apiKey = process.env.EXTENDED_API_KEY;
    const apiUrl =
      process.env.EXTENDED_API_URL || 'https://api.starknet.extended.exchange';
    const privateKey = process.env.EXTENDED_PRIVATE_KEY;

    if (!apiKey) {
      throw new Error('EXTENDED_API_KEY must be set in environment variables');
    }

    env = {
      apiKey,
      apiUrl,
      privateKey,
    };
  });

  describe('Balance and Account Info', () => {
    it('should get account balance', async () => {
      const result = await getBalance(env, {});

      expect(result.status).toBe('success');
      expect(result.data).toBeDefined();
      const balance = getDataAsRecord(result.data);
      expect(balance).toHaveProperty('collateralName');
      expect(balance).toHaveProperty('balance');
      expect(balance).toHaveProperty('equity');
      expect(balance).toHaveProperty('availableForTrade');
      expect(balance).toHaveProperty('availableForWithdrawal');
      expect(balance).toHaveProperty('unrealisedPnl');
      expect(balance).toHaveProperty('initialMargin');
      expect(balance).toHaveProperty('marginRatio');
      expect(balance).toHaveProperty('updatedTime');
      expect(balance).toHaveProperty('exposure');
      expect(balance).toHaveProperty('leverage');
      expect(balance.updatedTime).toBeDefined();
      expect(typeof balance.updatedTime).toBe('number');
      expect(balance.updatedTime).toBeGreaterThan(0);
    });

    it('should get user account info', async () => {
      const result = await getUserAccountInfo(env, {});

      expect(result.status).toBe('success');
      expect(result.data).toBeDefined();
      const accountInfo = getDataAsRecord(result.data);
      expect(accountInfo).toHaveProperty('status');
      expect(accountInfo).toHaveProperty('l2Key');
      expect(accountInfo).toHaveProperty('l2Vault');
      expect(accountInfo).toHaveProperty('accountId');
      expect(accountInfo).toHaveProperty('description');
      expect(accountInfo).toHaveProperty('bridgeStarknetAddress');
      expect(accountInfo.l2Key).toBeDefined();
      expect(accountInfo.l2Vault).toBeDefined();
    });
  });

  describe('Positions', () => {
    it('should get all open positions', async () => {
      const result = await getPositions(env, {});

      expect(result.status).toBe('success');
      expect(result.data).toBeDefined();
      const positions = getDataAsArray(result.data);
      expect(Array.isArray(positions)).toBe(true);
      // If positions exist, verify structure
      if (positions.length > 0) {
        const position = positions[0];
        expect(position).toHaveProperty('id');
        expect(position).toHaveProperty('market');
        expect(position).toHaveProperty('side');
        expect(['LONG', 'SHORT']).toContain(position.side);
        expect(position).toHaveProperty('leverage');
        expect(position).toHaveProperty('size');
        expect(position).toHaveProperty('value');
        expect(position).toHaveProperty('openPrice');
        expect(position).toHaveProperty('markPrice');
      }
    });

    it('should get positions filtered by market', async () => {
      // First get all positions to find a market
      const allPositionsResult = await getPositions(env, {});
      if (allPositionsResult.status === 'success' && allPositionsResult.data) {
        const positions = getDataAsArray(allPositionsResult.data);
        if (positions.length > 0) {
          const market = positions[0].market;
          const result = await getPositions(env, { market });

          expect(result.status).toBe('success');
          expect(result.data).toBeDefined();
          const filteredPositions = getDataAsArray(result.data);
          filteredPositions.forEach((pos: any) => {
            expect(pos.market).toBe(market);
          });
        }
      }
    });

    it('should get positions filtered by side', async () => {
      const result = await getPositions(env, { side: 'LONG' });

      expect(result.status).toBe('success');
      expect(result.data).toBeDefined();
      const positions = getDataAsArray(result.data);
      positions.forEach((pos: any) => {
        expect(pos.side).toBe('LONG');
      });
    });
  });

  describe('Orders', () => {
    it('should get all open orders', async () => {
      const result = await getOpenOrders(env, {});

      expect(result.status).toBe('success');
      expect(result.data).toBeDefined();
      const orders = getDataAsArray(result.data);
      expect(Array.isArray(orders)).toBe(true);
      // If orders exist, verify structure
      if (orders.length > 0) {
        const order = orders[0];
        expect(order).toHaveProperty('id');
        expect(order).toHaveProperty('market');
        expect(order).toHaveProperty('type');
        expect(['LIMIT', 'MARKET']).toContain(order.type);
        expect(order).toHaveProperty('side');
        expect(['BUY', 'SELL']).toContain(order.side);
        expect(order).toHaveProperty('status');
        expect(order).toHaveProperty('price');
        expect(order).toHaveProperty('qty');
        expect(order).toHaveProperty('createdTime');
        expect(order.createdTime).toBeDefined();
        expect(typeof order.createdTime).toBe('number');
        expect(order.createdTime).toBeGreaterThan(0);
      }
    });

    it('should get open orders filtered by market', async () => {
      // First get all orders to find a market
      const allOrdersResult = await getOpenOrders(env, {});
      if (allOrdersResult.status === 'success' && allOrdersResult.data) {
        const orders = getDataAsArray(allOrdersResult.data);
        if (orders.length > 0) {
          const market = orders[0].market;
          const result = await getOpenOrders(env, { market });

          expect(result.status).toBe('success');
          expect(result.data).toBeDefined();
          const filteredOrders = getDataAsArray(result.data);
          filteredOrders.forEach((order: any) => {
            expect(order.market).toBe(market);
          });
        }
      }
    });

    it('should get open orders filtered by type and side', async () => {
      const result = await getOpenOrders(env, { type: 'LIMIT', side: 'BUY' });

      expect(result.status).toBe('success');
      expect(result.data).toBeDefined();
      const orders = getDataAsArray(result.data);
      orders.forEach((order: any) => {
        expect(order.type).toBe('LIMIT');
        expect(order.side).toBe('BUY');
      });
    });

    it('should get order by ID', async () => {
      // First get an order ID from open orders
      const allOrdersResult = await getOpenOrders(env, {});
      if (allOrdersResult.status === 'success' && allOrdersResult.data) {
        const orders = getDataAsArray(allOrdersResult.data);
        if (orders.length > 0) {
          const orderId = orders[0].id.toString();
          const result = await getOrderById(env, { order_id: orderId });

          expect(result.status).toBe('success');
          expect(result.data).toBeDefined();
          const order = getDataAsRecord(result.data);
          expect(order.id.toString()).toBe(orderId);
        } else {
          // If no open orders, skip this test
          console.log('Skipping getOrderById test - no open orders available');
        }
      }
    });
  });

  describe('History', () => {
    it('should get trades history', async () => {
      const result = await getTradesHistory(env, { limit: 10 });

      expect(result.status).toBe('success');
      expect(result.data).toBeDefined();
      const trades = getDataAsArray(result.data);
      expect(Array.isArray(trades)).toBe(true);
      expect(trades.length).toBeLessThanOrEqual(10);
      // If trades exist, verify structure
      if (trades.length > 0) {
        const trade = trades[0];
        expect(trade).toHaveProperty('id');
        expect(trade).toHaveProperty('market');
        expect(trade).toHaveProperty('orderId');
        expect(trade).toHaveProperty('side');
        expect(trade).toHaveProperty('price');
        expect(trade).toHaveProperty('qty');
        expect(trade).toHaveProperty('value');
        expect(trade).toHaveProperty('fee');
        expect(trade).toHaveProperty('createdTime');
        expect(trade.createdTime).toBeDefined();
        expect(typeof trade.createdTime).toBe('number');
        expect(trade.createdTime).toBeGreaterThan(0);
      }
    });

    it('should get trades history with time range', async () => {
      const endTime = Date.now();
      const startTime = endTime - 7 * 24 * 60 * 60 * 1000; // 7 days ago
      const result = await getTradesHistory(env, {
        start_time: startTime,
        end_time: endTime,
        limit: 5,
      });

      expect(result.status).toBe('success');
      expect(result.data).toBeDefined();
      const trades = getDataAsArray(result.data);
      expect(Array.isArray(trades)).toBe(true);
      trades.forEach((trade: any) => {
        expect(trade.createdTime).toBeGreaterThanOrEqual(startTime);
        expect(trade.createdTime).toBeLessThanOrEqual(endTime);
      });
    });

    it('should get orders history', async () => {
      const result = await getOrdersHistory(env, { limit: 10 });

      expect(result.status).toBe('success');
      expect(result.data).toBeDefined();
      const orders = getDataAsArray(result.data);
      expect(Array.isArray(orders)).toBe(true);
      expect(orders.length).toBeLessThanOrEqual(10);
      // If orders exist, verify structure
      if (orders.length > 0) {
        const order = orders[0];
        expect(order).toHaveProperty('id');
        expect(order).toHaveProperty('market');
        expect(order).toHaveProperty('type');
        expect(order).toHaveProperty('side');
        expect(order).toHaveProperty('status');
        expect(['FILLED', 'CANCELLED', 'REJECTED', 'EXPIRED']).toContain(
          order.status
        );
      }
    });

    it('should get orders history with limit', async () => {
      const result = await getOrdersHistory(env, {
        limit: 5,
      });

      expect(result.status).toBe('success');
      expect(result.data).toBeDefined();
      const orders = getDataAsArray(result.data);
      expect(orders.length).toBeLessThanOrEqual(5);
    });

    it('should get positions history', async () => {
      const result = await getPositionsHistory(env, { limit: 10 });

      expect(result.status).toBe('success');
      expect(result.data).toBeDefined();
      const positions = getDataAsArray(result.data);
      expect(Array.isArray(positions)).toBe(true);
      expect(positions.length).toBeLessThanOrEqual(10);
      // If positions exist, verify structure
      if (positions.length > 0) {
        const position = positions[0];
        expect(position).toHaveProperty('id');
        expect(position).toHaveProperty('market');
        expect(position).toHaveProperty('side');
        expect(position).toHaveProperty('realisedPnl');
      }
    });

    it('should get funding payments', async () => {
      const fromTime = Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 days ago
      const result = await getFundingPayments(env, { fromTime });

      expect(result.status).toBe('success');
      expect(result.data).toBeDefined();
      const payments = getDataAsArray(result.data);
      expect(Array.isArray(payments)).toBe(true);
      // If payments exist, verify structure
      if (payments.length > 0) {
        const payment = payments[0];
        expect(payment).toHaveProperty('market');
        expect(payment).toHaveProperty('fundingFee');
        expect(payment).toHaveProperty('paidTime');
        expect(payment).toHaveProperty('accountId');
        expect(payment).toHaveProperty('fundingRate');
        expect(payment).toHaveProperty('id');
        expect(payment).toHaveProperty('markPrice');
        expect(payment).toHaveProperty('positionId');
        expect(payment).toHaveProperty('side');
        expect(payment).toHaveProperty('size');
        expect(payment).toHaveProperty('value');
        expect(typeof payment.market).toBe('string');
        expect(typeof payment.fundingFee).toBe('string');
        expect(typeof payment.paidTime).toBe('number');
        expect(payment.paidTime).toBeGreaterThan(0);
      }
    });
  });

  describe('Settings', () => {
    it('should get leverage settings', async () => {
      const result = await getLeverage(env, {});

      expect(result.status).toBe('success');
      expect(result.data).toBeDefined();
      const leverageSettings = getDataAsArray(result.data);
      expect(Array.isArray(leverageSettings)).toBe(true);
      // If settings exist, verify structure
      if (leverageSettings.length > 0) {
        const setting = leverageSettings[0];
        expect(setting).toHaveProperty('market');
        expect(setting).toHaveProperty('leverage');
        expect(typeof setting.market).toBe('string');
        expect(typeof setting.leverage).toBe('string');
      }
    });

    it('should get fees', async () => {
      const result = await getFees(env, {});

      expect(result.status).toBe('success');
      expect(result.data).toBeDefined();
      // API returns an array of fee objects, not a single FeeSchedule
      const fees = getDataAsArray(result.data);
      expect(Array.isArray(fees)).toBe(true);
      // If fees exist, verify structure
      if (fees.length > 0) {
        const fee = fees[0];
        expect(fee).toHaveProperty('market');
        // API returns camelCase: makerFeeRate, takerFeeRate, builderFeeRate
        expect(fee).toHaveProperty('makerFeeRate');
        expect(fee).toHaveProperty('takerFeeRate');
        expect(fee).toHaveProperty('builderFeeRate');
        expect(typeof fee.market).toBe('string');
        expect(typeof fee.makerFeeRate).toBe('string');
        expect(typeof fee.takerFeeRate).toBe('string');
      }
    });
  });
});
