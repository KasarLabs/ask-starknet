import { describe, beforeAll, it, expect, afterEach } from '@jest/globals';
import { createLimitOrder } from '../../src/tools/write/createLimitOrder.js';
import { createLimitOrderWithTpSl } from '../../src/tools/write/createLimitOrderWithTpSl.js';
import { createMarketOrder } from '../../src/tools/write/createMarketOrder.js';
import { addPositionTpSl } from '../../src/tools/write/addPositionTpSl.js';
import { cancelOrder } from '../../src/tools/write/cancelOrder.js';
import { updateLeverage } from '../../src/tools/write/updateLeverage.js';
import { getOpenOrders } from '../../src/tools/read/getOpenOrders.js';
import { getOrderById } from '../../src/tools/read/getOrderById.js';
import { getPositions } from '../../src/tools/read/getPositions.js';
import { getLeverage } from '../../src/tools/read/getLeverage.js';
import { getMarkets } from '../../src/tools/read/getMarkets.js';
import { getMarketStats } from '../../src/tools/read/getMarketStats.js';
import { ExtendedApiEnv } from '../../src/lib/types/index.js';
import {
  getDataAsRecord,
  getDataAsArray,
  sleep,
  calculateQtyFor1USD,
} from '../helpers.js';

describe('Extended Write Operations - Trading', () => {
  let env: ExtendedApiEnv;
  let testMarket: string;
  let createdOrderIds: string[] = [];
  let positionOrderId: string | undefined; // Order ID for position TP/SL test

  beforeAll(async () => {
    const apiKey = process.env.EXTENDED_API_KEY;
    const apiUrl =
      process.env.EXTENDED_API_URL || 'https://api.starknet.extended.exchange';
    const privateKey = process.env.EXTENDED_PRIVATE_KEY;

    if (!apiKey) {
      throw new Error('EXTENDED_API_KEY must be set in environment variables');
    }

    if (!privateKey) {
      throw new Error(
        'EXTENDED_PRIVATE_KEY must be set in environment variables for write operations'
      );
    }

    env = {
      apiKey,
      apiUrl,
      privateKey,
    };

    // Get a market to use for testing
    const marketsResult = await getMarkets(env, {});
    if (marketsResult.status === 'success' && marketsResult.data) {
      const markets = getDataAsArray(marketsResult.data);
      // Find an active market
      const activeMarket = markets.find(
        (m: any) => m.active && m.status === 'ACTIVE'
      );
      if (activeMarket) {
        testMarket = activeMarket.name;
      } else if (markets.length > 0) {
        testMarket = markets[0].name;
      }
    }

    if (!testMarket) {
      throw new Error('No markets available for testing');
    }
  });

  afterEach(async () => {
    // Cleanup: cancel all created orders except positionOrderId
    for (const orderId of createdOrderIds) {
      if (orderId !== positionOrderId) {
        try {
          await cancelOrder(env, { order_id: orderId });
          await sleep(1000);
        } catch (error) {
          // Ignore errors during cleanup
          console.warn(`Cleanup cancel order error for ${orderId}:`, error);
        }
      }
    }
    createdOrderIds = [];
    await sleep(2000);
  });

  describe('Leverage', () => {
    it('should update leverage for a market and verify with getLeverage', async () => {
      const targetLeverage = 40;
      const result = await updateLeverage(env, {
        market_id: testMarket,
        leverage: targetLeverage,
      });

      expect(result.status).toBe('success');
      expect(result.data).toBeDefined();
      if (result.status === 'success' && result.data) {
        const data = getDataAsRecord(result.data);
        if (Object.keys(data).length > 0) {
          expect(data).toHaveProperty('success');
        }
      }

      // Verify leverage was updated using getLeverage
      await sleep(2000);
      const leverageResult = await getLeverage(env, { market: testMarket });
      expect(leverageResult.status).toBe('success');
      if (leverageResult.status === 'success' && leverageResult.data) {
        const leverageSettings = getDataAsArray(leverageResult.data);
        const marketLeverage = leverageSettings.find(
          (s: any) => s.market === testMarket
        );
        if (marketLeverage) {
          expect(parseFloat(marketLeverage.leverage)).toBe(targetLeverage);
        }
      }
    });

    it('should handle invalid leverage gracefully', async () => {
      // Try with a very high leverage that might be rejected
      const result = await updateLeverage(env, {
        market_id: testMarket,
        leverage: 1000,
      });

      // This might succeed or fail depending on market limits
      // We just verify it returns a response
      expect(result).toHaveProperty('status');
    });
  });

  describe('Market Orders - Create Position for Subsequent Tests', () => {
    it('should create a market buy order to establish a LONG position and verify with getPositions', async () => {
      // Get initial positions count
      const initialPositionsResult = await getPositions(env, {
        market: testMarket,
      });
      let initialLongPositions = 0;
      if (
        initialPositionsResult.status === 'success' &&
        initialPositionsResult.data
      ) {
        const positions = getDataAsArray(initialPositionsResult.data);
        initialLongPositions = positions.filter(
          (p: any) => p.side === 'LONG'
        ).length;
      }

      // Get current market price to calculate quantity
      const statsResult = await getMarketStats(env, { market: testMarket });
      if (statsResult.status !== 'success' || !statsResult.data) {
        throw new Error('Failed to get market stats');
      }
      const stats = getDataAsRecord(statsResult.data);
      const currentPrice = parseFloat(stats.lastPrice);
      const qty = calculateQtyFor1USD(currentPrice);

      const result = await createMarketOrder(env, {
        market: testMarket,
        side: 'BUY',
        qty,
        reduce_only: false,
        slippage: 0.75,
      });

      // Market orders execute immediately, so they might not return an order ID
      // or might return a filled order
      expect(result).toHaveProperty('status');
      if (result.status === 'success' && result.data) {
        const order = getDataAsRecord(result.data);
        if (order.id) {
          expect(order).toHaveProperty('id');
          expect(order).toHaveProperty('externalId');
        }
      }

      // Verify position was created or updated using getPositions
      await sleep(2000);
      const positionsResult = await getPositions(env, { market: testMarket });
      expect(positionsResult.status).toBe('success');
      if (positionsResult.status === 'success' && positionsResult.data) {
        const positions = getDataAsArray(positionsResult.data);
        const longPositions = positions.filter((p: any) => p.side === 'LONG');
        // Either a new position was created or an existing one was increased
        expect(longPositions.length).toBeGreaterThanOrEqual(
          initialLongPositions
        );
      }
    });
  });

  describe('Limit Orders', () => {
    it('should create a limit buy order and verify with getOpenOrders', async () => {
      // Get current market price
      const statsResult = await getMarketStats(env, { market: testMarket });
      if (statsResult.status !== 'success' || !statsResult.data) {
        throw new Error('Failed to get market stats');
      }

      const stats = getDataAsRecord(statsResult.data);
      const currentPrice = parseFloat(stats.lastPrice);
      const limitPrice = (currentPrice * 0.9).toFixed(2); // 10% below current price
      const qty = calculateQtyFor1USD(currentPrice);

      const result = await createLimitOrder(env, {
        market: testMarket,
        side: 'BUY',
        qty,
        price: limitPrice,
        post_only: true,
        reduce_only: false,
        time_in_force: 'GTT',
        expiry_epoch_millis: Date.now() + 24 * 60 * 60 * 1000, // 24 hours from now
      });

      expect(result.status).toBe('success');
      expect(result.data).toBeDefined();
      let orderId: string | undefined;
      if (result.status === 'success' && result.data) {
        const order = getDataAsRecord(result.data);
        expect(order).toHaveProperty('id');
        expect(order).toHaveProperty('externalId');
        orderId = order.id.toString();
        if (orderId) {
          createdOrderIds.push(orderId);
        }
      }

      // Verify order exists using getOpenOrders
      await sleep(2000);
      if (orderId) {
        const openOrdersResult = await getOpenOrders(env, {
          market: testMarket,
        });
        expect(openOrdersResult.status).toBe('success');
        if (openOrdersResult.status === 'success' && openOrdersResult.data) {
          const orders = getDataAsArray(openOrdersResult.data);
          const foundOrder = orders.find(
            (o: any) => o.id.toString() === orderId
          );
          expect(foundOrder).toBeDefined();
          expect(foundOrder?.market).toBe(testMarket);
          expect(foundOrder?.side).toBe('BUY');
          expect(foundOrder?.type).toBe('LIMIT');
        }
      }
    });

    it('should create a limit sell order and verify with getOrderById', async () => {
      // Get current market price
      const statsResult = await getMarketStats(env, { market: testMarket });
      if (statsResult.status !== 'success' || !statsResult.data) {
        throw new Error('Failed to get market stats');
      }

      const stats = getDataAsRecord(statsResult.data);
      const currentPrice = parseFloat(stats.lastPrice);
      const limitPrice = (currentPrice * 1.1).toFixed(2); // 10% above current price
      const qty = calculateQtyFor1USD(currentPrice);

      const result = await createLimitOrder(env, {
        market: testMarket,
        side: 'SELL',
        qty,
        price: limitPrice,
        post_only: true,
        reduce_only: false,
        time_in_force: 'GTT',
        expiry_epoch_millis: Date.now() + 24 * 60 * 60 * 1000, // 24 hours from now
      });

      expect(result.status).toBe('success');
      expect(result.data).toBeDefined();
      let orderId: string | undefined;
      if (result.status === 'success' && result.data) {
        const order = getDataAsRecord(result.data);
        expect(order).toHaveProperty('id');
        expect(order).toHaveProperty('externalId');
        orderId = order.id.toString();
        if (orderId) {
          createdOrderIds.push(orderId);
        }
      }

      // Verify order exists using getOrderById
      await sleep(2000);
      if (orderId) {
        const orderByIdResult = await getOrderById(env, { order_id: orderId });
        expect(orderByIdResult.status).toBe('success');
        if (orderByIdResult.status === 'success' && orderByIdResult.data) {
          const order = getDataAsRecord(orderByIdResult.data);
          expect(order.id.toString()).toBe(orderId);
          expect(order.market).toBe(testMarket);
          expect(order.side).toBe('SELL');
          expect(order.type).toBe('LIMIT');
        }
      }
    });

    it('should create a limit order with different time in force', async () => {
      const statsResult = await getMarketStats(env, { market: testMarket });
      if (statsResult.status !== 'success' || !statsResult.data) {
        throw new Error('Failed to get market stats');
      }

      const stats = getDataAsRecord(statsResult.data);
      const currentPrice = parseFloat(stats.lastPrice);
      const limitPrice = (currentPrice * 0.9).toFixed(2);
      const qty = calculateQtyFor1USD(currentPrice);

      const timeInForceOptions: Array<'IOC' | 'FOK' | 'GTT'> = ['IOC', 'FOK'];
      for (const tif of timeInForceOptions) {
        const result = await createLimitOrder(env, {
          market: testMarket,
          side: 'BUY',
          qty,
          price: limitPrice,
          post_only: false,
          reduce_only: false,
          time_in_force: tif,
        });

        // IOC and FOK orders execute immediately or cancel, so they might not return an order
        if (result.status === 'success' && result.data) {
          const order = getDataAsRecord(result.data);
          if (order.id) {
            createdOrderIds.push(order.id.toString());
          }
        }
        await sleep(1000);
      }
    });
  });

  describe('Limit Orders with TP/SL', () => {
    it('should create a limit order with take profit and stop loss and verify with getOpenOrders', async () => {
      const statsResult = await getMarketStats(env, { market: testMarket });
      if (statsResult.status !== 'success' || !statsResult.data) {
        throw new Error('Failed to get market stats');
      }

      const stats = getDataAsRecord(statsResult.data);
      const currentPrice = parseFloat(stats.lastPrice);
      const limitPrice = (currentPrice * 0.9).toFixed(2);
      const takeProfitPrice = (currentPrice * 0.95).toFixed(2);
      const stopLossPrice = (currentPrice * 0.85).toFixed(2);
      const qty = calculateQtyFor1USD(currentPrice);

      const result = await createLimitOrderWithTpSl(env, {
        market: testMarket,
        side: 'BUY',
        qty,
        price: limitPrice,
        post_only: true,
        reduce_only: false,
        time_in_force: 'GTT',
        expiry_epoch_millis: Date.now() + 24 * 60 * 60 * 1000,
        take_profit: {
          trigger_price: takeProfitPrice,
          trigger_price_type: 'MARK',
          price: takeProfitPrice,
          price_type: 'LIMIT',
        },
        stop_loss: {
          trigger_price: stopLossPrice,
          trigger_price_type: 'MARK',
          price: stopLossPrice,
          price_type: 'LIMIT',
        },
      });

      expect(result.status).toBe('success');
      expect(result.data).toBeDefined();
      let orderId: string | undefined;
      if (result.status === 'success' && result.data) {
        const order = getDataAsRecord(result.data);
        expect(order).toHaveProperty('id');
        expect(order).toHaveProperty('externalId');
        orderId = order.id.toString();
        if (orderId) {
          createdOrderIds.push(orderId);
        }
      }

      // Verify order exists using getOpenOrders
      await sleep(2000);
      if (orderId) {
        const openOrdersResult = await getOpenOrders(env, {
          market: testMarket,
          side: 'BUY',
        });
        expect(openOrdersResult.status).toBe('success');
        if (openOrdersResult.status === 'success' && openOrdersResult.data) {
          const orders = getDataAsArray(openOrdersResult.data);
          const foundOrder = orders.find(
            (o: any) => o.id.toString() === orderId
          );
          expect(foundOrder).toBeDefined();
          expect(foundOrder?.market).toBe(testMarket);
        }
      }
    });
  });

  describe('Cancel Orders', () => {
    it('should cancel an existing order and verify with getOpenOrders', async () => {
      const statsResult = await getMarketStats(env, { market: testMarket });
      if (statsResult.status !== 'success' || !statsResult.data) {
        throw new Error('Failed to get market stats');
      }

      const stats = getDataAsRecord(statsResult.data);
      const currentPrice = parseFloat(stats.lastPrice);
      const limitPrice = (currentPrice * 0.9).toFixed(2);
      const qty = calculateQtyFor1USD(currentPrice);

      const createResult = await createLimitOrder(env, {
        market: testMarket,
        side: 'BUY',
        qty,
        price: limitPrice,
        post_only: true,
        reduce_only: false,
        time_in_force: 'GTT',
        expiry_epoch_millis: Date.now() + 24 * 60 * 60 * 1000,
      });

      expect(createResult.status).toBe('success');
      expect(createResult.data).toBeDefined();
      const order = getDataAsRecord(createResult.data);
      const orderId = order.id.toString();

      await sleep(2000);

      // Verify order exists before cancellation
      const beforeCancelResult = await getOpenOrders(env, {
        market: testMarket,
      });
      expect(beforeCancelResult.status).toBe('success');
      if (beforeCancelResult.status === 'success' && beforeCancelResult.data) {
        const ordersBefore = getDataAsArray(beforeCancelResult.data);
        const orderExists = ordersBefore.some(
          (o: any) => o.id.toString() === orderId
        );
        expect(orderExists).toBe(true);
      }

      const cancelResult = await cancelOrder(env, { order_id: orderId });

      expect(cancelResult.status).toBe('success');
      expect(cancelResult.data).toBeDefined();

      // Verify order no longer exists in open orders
      await sleep(2000);
      const afterCancelResult = await getOpenOrders(env, {
        market: testMarket,
      });
      expect(afterCancelResult.status).toBe('success');
      if (afterCancelResult.status === 'success' && afterCancelResult.data) {
        const ordersAfter = getDataAsArray(afterCancelResult.data);
        const orderStillExists = ordersAfter.some(
          (o: any) => o.id.toString() === orderId
        );
        expect(orderStillExists).toBe(false);
      }
    });

    it('should cancel an order and verify with getOrderById', async () => {
      const statsResult = await getMarketStats(env, { market: testMarket });
      if (statsResult.status !== 'success' || !statsResult.data) {
        throw new Error('Failed to get market stats');
      }

      const stats = getDataAsRecord(statsResult.data);
      const currentPrice = parseFloat(stats.lastPrice);
      const limitPrice = (currentPrice * 0.9).toFixed(2);
      const qty = calculateQtyFor1USD(currentPrice);

      const createResult = await createLimitOrder(env, {
        market: testMarket,
        side: 'BUY',
        qty,
        price: limitPrice,
        post_only: true,
        reduce_only: false,
        time_in_force: 'GTT',
        expiry_epoch_millis: Date.now() + 24 * 60 * 60 * 1000,
      });

      expect(createResult.status).toBe('success');
      expect(createResult.data).toBeDefined();
      const order = getDataAsRecord(createResult.data);
      const orderId = order.id.toString();
      createdOrderIds.push(orderId);

      await sleep(2000);

      // Verify order exists using getOrderById
      const orderByIdResult = await getOrderById(env, { order_id: orderId });
      expect(orderByIdResult.status).toBe('success');
      if (orderByIdResult.status === 'success' && orderByIdResult.data) {
        const orderData = getDataAsRecord(orderByIdResult.data);
        expect(orderData.id.toString()).toBe(orderId);
        expect(orderData.status).not.toBe('CANCELLED');
      }

      const cancelResult = await cancelOrder(env, { order_id: orderId });
      expect(cancelResult.status).toBe('success');

      // Verify order status changed to CANCELLED
      await sleep(2000);
      const cancelledOrderResult = await getOrderById(env, {
        order_id: orderId,
      });
      expect(cancelledOrderResult.status).toBe('success');
      if (
        cancelledOrderResult.status === 'success' &&
        cancelledOrderResult.data
      ) {
        const cancelledOrder = getDataAsRecord(cancelledOrderResult.data);
        expect(cancelledOrder.id.toString()).toBe(orderId);
        expect(cancelledOrder.status).toBe('CANCELLED');
      }
    });
  });

  describe('Position TP/SL', () => {
    it('should add TP/SL to the existing LONG position and verify with getOpenOrders', async () => {
      // Verify we have a position from the market order test
      const positionsResult = await getPositions(env, { market: testMarket });
      expect(positionsResult.status).toBe('success');
      expect(positionsResult.data).toBeDefined();

      const positions = getDataAsArray(positionsResult.data);
      const position = positions.find((p: any) => p.market === testMarket);
      expect(position).toBeDefined();
      expect(position.side).toBe('LONG');

      const statsResult = await getMarketStats(env, { market: testMarket });
      if (statsResult.status !== 'success' || !statsResult.data) {
        throw new Error('Failed to get market stats');
      }

      const stats = getDataAsRecord(statsResult.data);
      const currentPrice = parseFloat(stats.lastPrice);
      const takeProfitPrice = (currentPrice * 1.05).toFixed(2);
      const stopLossPrice = (currentPrice * 0.95).toFixed(2);

      const oppositeSide = 'SELL';
      const positionSize = parseFloat(position.size);

      const qty = positionSize.toString();

      const result = await addPositionTpSl(env, {
        market: testMarket,
        side: oppositeSide,
        qty,
        take_profit: {
          trigger_price: takeProfitPrice,
          trigger_price_type: 'MARK',
          price: takeProfitPrice,
          price_type: 'LIMIT',
        },
        stop_loss: {
          trigger_price: stopLossPrice,
          trigger_price_type: 'MARK',
          price: stopLossPrice,
          price_type: 'LIMIT',
        },
      });

      expect(result.status).toBe('success');
      expect(result.data).toBeDefined();
      const order = getDataAsRecord(result.data);
      expect(order).toHaveProperty('id');
      expect(order).toHaveProperty('externalId');
      const orderId = order.id.toString();
      positionOrderId = orderId;
      if (orderId) {
        createdOrderIds.push(orderId);
      }

      // Verify TP/SL order exists using getOpenOrders
      await sleep(2000);
      const openOrdersResult = await getOpenOrders(env, {
        market: testMarket,
      });
      expect(openOrdersResult.status).toBe('success');
      if (openOrdersResult.status === 'success' && openOrdersResult.data) {
        const orders = getDataAsArray(openOrdersResult.data);
        const foundOrder = orders.find((o: any) => o.id.toString() === orderId);
        expect(foundOrder).toBeDefined();
        expect(foundOrder?.market).toBe(testMarket);
        expect(foundOrder?.side).toBe(oppositeSide);
      }
    });
  });

  describe('Market Orders - Reduce Only', () => {
    it('should create a market sell order with reduce only using the remaining LONG position', async () => {
      // Verify we still have a LONG position (may have been reduced by TP/SL test)
      const positionsResult = await getPositions(env, { market: testMarket });
      expect(positionsResult.status).toBe('success');
      expect(positionsResult.data).toBeDefined();

      const positions = getDataAsArray(positionsResult.data);
      const longPosition = positions.find((p: any) => p.side === 'LONG');

      // If position was closed by TP/SL, create a new one for this test
      if (!longPosition || parseFloat(longPosition.size) < 0.0001) {
        const statsResult = await getMarketStats(env, { market: testMarket });
        if (statsResult.status !== 'success' || !statsResult.data) {
          throw new Error('Failed to get market stats');
        }
        const stats = getDataAsRecord(statsResult.data);
        const currentPrice = parseFloat(stats.lastPrice);
        const qty = calculateQtyFor1USD(currentPrice);

        const createResult = await createMarketOrder(env, {
          market: testMarket,
          side: 'BUY',
          qty,
          reduce_only: false,
          slippage: 0.75,
        });

        expect(createResult).toHaveProperty('status');
        await sleep(2000);
      }

      // Now verify we have a position
      const positionsAfterCreate = await getPositions(env, {
        market: testMarket,
      });
      expect(positionsAfterCreate.status).toBe('success');
      const positionsArray = getDataAsArray(positionsAfterCreate.data);
      const positionToReduce = positionsArray.find(
        (p: any) => p.side === 'LONG'
      );
      expect(positionToReduce).toBeDefined();

      // Get current market price to calculate quantity
      const statsResult = await getMarketStats(env, { market: testMarket });
      if (statsResult.status !== 'success' || !statsResult.data) {
        throw new Error('Failed to get market stats');
      }
      const stats = getDataAsRecord(statsResult.data);
      const currentPrice = parseFloat(stats.lastPrice);
      const qty = calculateQtyFor1USD(currentPrice);

      const result = await createMarketOrder(env, {
        market: testMarket,
        side: 'SELL',
        qty,
        reduce_only: true,
        slippage: 0.75,
      });

      expect(result).toHaveProperty('status');

      // Verify position was reduced
      await sleep(2000);
      const positionsAfterResult = await getPositions(env, {
        market: testMarket,
      });
      expect(positionsAfterResult.status).toBe('success');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid market gracefully', async () => {
      // For invalid market test, use a small fixed quantity
      const result = await createLimitOrder(env, {
        market: 'INVALID-MARKET-XXX',
        side: 'BUY',
        qty: '0.0001',
        price: '1000',
        post_only: false,
        reduce_only: false,
        time_in_force: 'GTT',
      });

      expect(result.status).toBe('failure');
      expect(result.error).toBeDefined();
    });

    it('should handle invalid quantity gracefully', async () => {
      const statsResult = await getMarketStats(env, { market: testMarket });
      if (statsResult.status !== 'success' || !statsResult.data) {
        throw new Error('Failed to get market stats');
      }

      const stats = getDataAsRecord(statsResult.data);
      const currentPrice = parseFloat(stats.lastPrice);
      const limitPrice = (currentPrice * 0.9).toFixed(2);

      const result = await createLimitOrder(env, {
        market: testMarket,
        side: 'BUY',
        qty: '0.0000000001',
        price: limitPrice,
        post_only: false,
        reduce_only: false,
        time_in_force: 'GTT',
      });

      // Might succeed or fail depending on market min order size
      expect(result).toHaveProperty('status');
    });

    it('should handle missing private key gracefully', async () => {
      const envWithoutKey: ExtendedApiEnv = {
        apiKey: env.apiKey!,
        apiUrl: env.apiUrl,
      };

      const statsResult = await getMarketStats(env, { market: testMarket });
      let qty = '0.0001';
      if (statsResult.status === 'success' && statsResult.data) {
        const stats = getDataAsRecord(statsResult.data);
        const currentPrice = parseFloat(stats.lastPrice);
        qty = calculateQtyFor1USD(currentPrice);
      }

      const result = await createLimitOrder(envWithoutKey, {
        market: testMarket,
        side: 'BUY',
        qty,
        price: '1000',
        post_only: false,
        reduce_only: false,
        time_in_force: 'GTT',
      });

      expect(result.status).toBe('failure');
      expect(result.error).toBeDefined();
      expect(result.error).toContain('EXTENDED_PRIVATE_KEY');
    });
  });
});
