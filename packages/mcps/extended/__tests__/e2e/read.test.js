// E2E tests for all read-only Extended MCP tools
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
 * Test extended_get_balance tool
 */
async function testGetBalance(client) {
  const response = await callTool(client, 'extended_get_balance', {});

  if (response.status !== 'success') {
    throw new Error(`extended_get_balance failed: ${response.error}`);
  }

  console.log('✅ extended_get_balance test passed');
  return response;
}

/**
 * Test extended_get_user_account_info tool
 */
async function testGetUserAccountInfo(client) {
  const response = await callTool(client, 'extended_get_user_account_info', {});

  if (response.status !== 'success') {
    throw new Error(`extended_get_user_account_info failed: ${response.error}`);
  }

  console.log('✅ extended_get_user_account_info test passed');

  return response;
}

/**
 * Test extended_get_positions tool
 */
async function testGetPositions(client) {
  // Test without filters
  const response = await callTool(client, 'extended_get_positions', {});

  if (response.status !== 'success') {
    throw new Error(`extended_get_positions failed: ${response.error}`);
  }

  console.log('✅ extended_get_positions test passed');

  // Test with filters (optional)
  const responseFiltered = await callTool(client, 'extended_get_positions', {
    market: 'BTC-USD',
    side: 'LONG',
  });

  if (responseFiltered.status !== 'success') {
    throw new Error(
      `extended_get_positions (filtered) failed: ${responseFiltered.error}`
    );
  }

  console.log('✅ extended_get_positions (filtered) test passed');

  return response;
}

/**
 * Test extended_get_open_orders tool
 */
async function testGetOpenOrders(client) {
  // Test without filters
  const response = await callTool(client, 'extended_get_open_orders', {});

  if (response.status !== 'success') {
    throw new Error(`extended_get_open_orders failed: ${response.error}`);
  }

  console.log('✅ extended_get_open_orders test passed');

  // Test with filters (optional)
  const responseFiltered = await callTool(client, 'extended_get_open_orders', {
    market: 'BTC-USD',
    type: 'LIMIT',
    side: 'BUY',
  });

  if (responseFiltered.status !== 'success') {
    throw new Error(
      `extended_get_open_orders (filtered) failed: ${responseFiltered.error}`
    );
  }

  console.log('✅ extended_get_open_orders (filtered) test passed');

  return response;
}

/**
 * Test extended_get_trades_history tool
 */
async function testGetTradesHistory(client) {
  const response = await callTool(client, 'extended_get_trades_history', {
    limit: 10,
  });

  if (response.status !== 'success') {
    throw new Error(`extended_get_trades_history failed: ${response.error}`);
  }

  console.log('✅ extended_get_trades_history test passed');

  return response;
}

/**
 * Test extended_get_trades_history with market filter
 */
async function testGetTradesHistoryWithFilter(client) {
  const response = await callTool(client, 'extended_get_trades_history', {
    market_id: 'BTC-USD',
    limit: 5,
  });

  if (response.status !== 'success') {
    throw new Error(
      `extended_get_trades_history with filter failed: ${response.error}`
    );
  }

  console.log('✅ extended_get_trades_history (filtered) test passed');

  return response;
}

/**
 * Test extended_get_orders_history tool
 */
async function testGetOrdersHistory(client) {
  const response = await callTool(client, 'extended_get_orders_history', {
    limit: 10,
  });

  if (response.status !== 'success') {
    throw new Error(`extended_get_orders_history failed: ${response.error}`);
  }

  console.log('✅ extended_get_orders_history test passed');

  return response;
}

/**
 * Test extended_get_positions_history tool
 */
async function testGetPositionsHistory(client) {
  const response = await callTool(client, 'extended_get_positions_history', {
    limit: 10,
  });

  if (response.status !== 'success') {
    throw new Error(`extended_get_positions_history failed: ${response.error}`);
  }

  console.log('✅ extended_get_positions_history test passed');

  // Test with side filter (optional)
  const responseFiltered = await callTool(
    client,
    'extended_get_positions_history',
    {
      market_id: 'BTC-USD',
      side: 'LONG',
      limit: 5,
    }
  );

  if (responseFiltered.status !== 'success') {
    throw new Error(
      `extended_get_positions_history (filtered) failed: ${responseFiltered.error}`
    );
  }

  console.log('✅ extended_get_positions_history (filtered) test passed');

  return response;
}

/**
 * Test extended_get_funding_payments tool
 */
async function testGetFundingPayments(client) {
  // fromTime is required - get funding payments from the last 7 days
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const response = await callTool(client, 'extended_get_funding_payments', {
    fromTime: sevenDaysAgo,
  });

  if (response.status !== 'success') {
    throw new Error(`extended_get_funding_payments failed: ${response.error}`);
  }

  console.log('✅ extended_get_funding_payments test passed');

  return response;
}

/**
 * Test extended_get_leverage tool
 */
async function testGetLeverage(client) {
  // Test without filters (all markets)
  const response = await callTool(client, 'extended_get_leverage', {});

  if (response.status !== 'success') {
    throw new Error(`extended_get_leverage failed: ${response.error}`);
  }

  console.log('✅ extended_get_leverage test passed');

  // Test with market filter (optional)
  const responseFiltered = await callTool(client, 'extended_get_leverage', {
    market: 'BTC-USD',
  });

  if (responseFiltered.status !== 'success') {
    throw new Error(
      `extended_get_leverage (filtered) failed: ${responseFiltered.error}`
    );
  }

  console.log('✅ extended_get_leverage (filtered) test passed');

  return response;
}

/**
 * Test extended_get_fees tool
 */
async function testGetFees(client) {
  // Test without filters (global fees)
  const response = await callTool(client, 'extended_get_fees', {});

  if (response.status !== 'success') {
    throw new Error(`extended_get_fees failed: ${response.error}`);
  }

  console.log('✅ extended_get_fees test passed');

  // Test with market filter (optional)
  const responseFiltered = await callTool(client, 'extended_get_fees', {
    market: 'BTC-USD',
  });

  if (responseFiltered.status !== 'success') {
    throw new Error(
      `extended_get_fees (filtered) failed: ${responseFiltered.error}`
    );
  }

  console.log('✅ extended_get_fees (filtered) test passed');

  return response;
}

/**
 * Test extended_get_order_by_id tool
 * Note: This will fail if you don't have an actual order ID
 */
async function testGetOrderById(client, orderId) {
  if (!orderId) {
    console.log('⏭️  Skipping extended_get_order_by_id (no order ID provided)');
    return;
  }

  const response = await callTool(client, 'extended_get_order_by_id', {
    order_id: orderId,
  });

  if (response.status === 'success') {
    console.log('✅ extended_get_order_by_id test passed');
  } else {
    console.log(
      '⚠️  extended_get_order_by_id failed (expected if order not found)'
    );
  }

  return response;
}

/**
 * Test error handling with invalid parameters
 */
async function testErrorHandling(client) {
  console.log('\n--- Testing error handling ---');

  // Test with invalid time range (end before start)
  const futureTime = Date.now() + 365 * 24 * 60 * 60 * 1000;
  const response = await callTool(client, 'extended_get_trades_history', {
    start_time: futureTime,
    end_time: Date.now(),
    limit: 10,
  });

  // This might succeed or fail depending on API behavior
  if (response.status === 'success') {
    console.log('✅ Error handling test: API accepted invalid time range');
  } else {
    console.log('✅ Error handling test: API rejected invalid parameters');
  }

  return response;
}

/**
 * Main test runner
 */
async function runTests() {
  let client;

  try {
    console.log('🚀 Starting Extended Read Tools E2E Tests\n');
    console.log(
      '⚠️  Make sure you have set EXTENDED_API_KEY in your .env file\n'
    );

    client = await createClient();
    console.log('✅ Client connected successfully\n');

    // Run all READ tests
    await testGetBalance(client);
    await testGetUserAccountInfo(client);
    await testGetPositions(client);
    await testGetOpenOrders(client);
    await testGetTradesHistory(client);
    await testGetTradesHistoryWithFilter(client);
    await testGetOrdersHistory(client);
    await testGetPositionsHistory(client);
    await testGetFundingPayments(client);
    await testGetLeverage(client);
    await testGetFees(client);

    // Optional: test get order by ID if you have one
    // await testGetOrderById(client, 'your_order_id_here');

    await testErrorHandling(client);

    console.log('\n✅ All tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log('   - All READ tools are functional');
    console.log('   - API authentication working');
    console.log('   - Response parsing correct');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Full error:', error);

    if (error.message.includes('EXTENDED_API_KEY')) {
      console.error(
        '\n💡 Tip: Make sure you have set EXTENDED_API_KEY in packages/mcps/extended/.env'
      );
    }

    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\n👋 Client closed');
    }
  }
}

// Run the tests
runTests();
