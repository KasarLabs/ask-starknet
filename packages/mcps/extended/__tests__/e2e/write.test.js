// E2E tests for all write Extended MCP tools
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

/**
 * Helper function to create and connect a client
 */
async function createClient() {
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['build/index.js'],
  });

  const client = new Client({
    name: 'test-client',
    version: '1.0.0',
  });

  await client.connect(transport);
  return client;
}

/**
 * Helper function to call a tool and parse the result
 */
async function callTool(client, name, args) {
  const result = await client.callTool({ name, arguments: args });
  console.log(`\n--- ${name} ---`);
  console.log('Raw result:', JSON.stringify(result, null, 2));

  // Parse the MCP response
  const response = JSON.parse(result.content[0].text);
  console.log('Parsed response:', JSON.stringify(response, null, 2));

  return response;
}

/**
 * Test extended_create_limit_order tool
 */
async function testCreateLimitOrder(client) {
  const response = await callTool(client, 'extended_create_limit_order', {
    market: 'ETH-USD',
    side: 'BUY',
    qty: '0.01', // Min trade size for ETH = 0.01 ETH
    price: '1000', // Well below market (~$3000) to avoid execution
    post_only: false,
    reduce_only: false,
    time_in_force: 'GTT',
    expiry_epoch_millis: Date.now() + 86400000, // 24h expiry
  });

  if (response.status !== 'success') {
    console.log(`⚠️  extended_create_limit_order failed: ${response.error}`);
    return null;
  } else {
    console.log('✅ extended_create_limit_order test passed');
    console.log('   Order ID:', response.data.id);
    return response.data;
  }
}

/**
 * Test extended_create_market_order tool
 */
async function testCreateMarketOrder(client) {
  const response = await callTool(client, 'extended_create_market_order', {
    market: 'ARB-USD',
    side: 'BUY',
    qty: '10', // Min trade size for ARB = 10 ARB (~$6 at $0.60/ARB)
    reduce_only: false,
    slippage: 0.75, // 0.75% slippage tolerance
  });

  if (response.status !== 'success') {
    console.log(`⚠️  extended_create_market_order failed: ${response.error}`);
    return null;
  } else {
    console.log('✅ extended_create_market_order test passed');
    console.log('   Order ID:', response.data.id);
    return response.data;
  }
}

/**
 * Test extended_create_limit_order_with_tp_sl tool
 */
async function testCreateLimitOrderWithTpSl(client) {
  const response = await callTool(client, 'extended_create_limit_order_with_tpsl', {
    market: 'ETH-USD',
    side: 'BUY',
    qty: '0.01', // Min trade size for ETH = 0.01 ETH
    price: '1500', // Well below market (~$3000) to avoid execution
    post_only: false,
    reduce_only: false,
    time_in_force: 'GTT',
    expiry_epoch_millis: Date.now() + 86400000,
    take_profit: {
      trigger_price: '10000', // Very high TP (won't trigger)
      trigger_price_type: 'LAST',
      price: '10000',
      price_type: 'LIMIT',
    },
    // No stop_loss to avoid "TP/SL open loss exceeds equity" error
  });

  if (response.status !== 'success') {
    console.log(`⚠️  extended_create_limit_order_with_tp_sl failed: ${response.error}`);
    return null;
  } else {
    console.log('✅ extended_create_limit_order_with_tp_sl test passed (TP only)');
    console.log('   Order ID:', response.data.id);
    return response.data;
  }
}

/**
 * Test extended_add_position_tp_sl tool
 */
async function testAddPositionTpSl(client) {
  // First check if we have an open position
  const positionsResponse = await callTool(client, 'extended_get_positions', {
    market: 'ARB-USD',
  });

  if (positionsResponse.status !== 'success' || !positionsResponse.data || positionsResponse.data.length === 0) {
    console.log('⚠️  extended_add_position_tp_sl skipped: No open position found');
    return null;
  }

  const position = positionsResponse.data[0];
  const positionSide = position.side; // 'LONG' or 'SHORT'
  const orderSide = positionSide === 'LONG' ? 'SELL' : 'BUY'; // Opposite side to close
  const positionQty = Math.abs(parseFloat(position.size));

  console.log(`   Found ${positionSide} position with size ${positionQty}`);

  const response = await callTool(client, 'extended_add_position_tpsl', {
    market: 'ARB-USD',
    side: orderSide,
    qty: String(positionQty), // Close entire position
    take_profit: {
      trigger_price: positionSide === 'LONG' ? '10' : '0.1', // Price way out
      trigger_price_type: 'LAST',
      price: positionSide === 'LONG' ? '10' : '0.1',
      price_type: 'LIMIT',
    },
    stop_loss: {
      trigger_price: positionSide === 'LONG' ? '0.1' : '10',
      trigger_price_type: 'LAST',
      price: positionSide === 'LONG' ? '0.1' : '10',
      price_type: 'LIMIT',
    },
  });

  if (response.status !== 'success') {
    console.log(`⚠️  extended_add_position_tpsl failed: ${response.error}`);
    return null;
  } else {
    console.log('✅ extended_add_position_tpsl test passed');
    console.log('   Order ID:', response.data.id);
    return response.data;
  }
}

/**
 * Test extended_cancel_order tool
 */
async function testCancelOrder(client, orderId) {
  if (!orderId) {
    console.log('⚠️  extended_cancel_order skipped: No order ID provided');
    return null;
  }

  const response = await callTool(client, 'extended_cancel_order', {
    order_id: orderId,
  });

  if (response.status !== 'success') {
    console.log(`⚠️  extended_cancel_order failed: ${response.error}`);
    return null;
  } else {
    console.log('✅ extended_cancel_order test passed');
    console.log('   Cancelled order ID:', orderId);
    return response.data;
  }
}

/**
 * Main test runner
 */
async function main() {
  console.log('Starting Extended MCP Write Tools E2E Tests...\n');

  const client = await createClient();

  try {
    let limitOrder;
    // limitOrder = await testCreateLimitOrder(client);
    const limitOrderWithTpSl = await testCreateLimitOrderWithTpSl(client);
    // const marketOrder = await testCreateMarketOrder(client);

    // if (marketOrder) {
    //   console.log('\n   Waiting 3 seconds for order to be processed...');
    //   await new Promise(resolve => setTimeout(resolve, 3000));
    // }

    await testAddPositionTpSl(client);

    if (limitOrder) {
      await testCancelOrder(client, limitOrder.id);
    } else if (limitOrderWithTpSl) {
      await testCancelOrder(client, limitOrderWithTpSl.id);
    }

    console.log('\n✅ All write tool tests completed!');
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
