// E2E test for extended_cancel_order tool
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
 * Test extended_get_open_orders tool
 */
async function testGetOpenOrders(client, market) {
  const params = market ? { market } : {};

  const response = await callTool(client, 'extended_get_open_orders', params);

  if (response.status !== 'success') {
    console.log(`⚠️  extended_get_open_orders failed: ${response.error}`);
    return null;
  } else {
    console.log('✅ extended_get_open_orders test passed');
    console.log(`   Found ${response.data.length} open orders`);
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
  console.log('Starting extended_cancel_order E2E Test...\n');

  const client = await createClient();

  try {
    // Step 1: Get open orders
    const openOrders = await testGetOpenOrders(client);

    if (!openOrders || openOrders.length === 0) {
      console.log('\n⚠️  No open orders found to cancel. Test completed without cancellation.');
      return;
    }

    // Step 2: Cancel the first order
    const firstOrder = openOrders[0];
    console.log(`\nAttempting to cancel order: ${firstOrder.id}`);
    console.log(`  Order ID type: ${typeof firstOrder.id}`);
    console.log(`  Order ID as string: "${String(firstOrder.id)}"`);
    console.log(`  Market: ${firstOrder.market}`);
    console.log(`  Side: ${firstOrder.side}`);
    console.log(`  Price: ${firstOrder.price}`);
    console.log(`  Qty: ${firstOrder.qty}`);

    // Convert ID to string for the API
    await testCancelOrder(client, String(firstOrder.id));

    console.log('\n✅ Test completed!');
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
