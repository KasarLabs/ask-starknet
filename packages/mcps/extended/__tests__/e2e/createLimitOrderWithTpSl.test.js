// E2E test for extended_create_limit_order_with_tpsl tool
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
 * Test extended_create_limit_order_with_tp_sl tool
 */
async function testCreateLimitOrderWithTpSl(client) {
  const side = 'BUY';
  const entryPrice = 1000; // Well below market (~$3000) to avoid execution

  // Use same values as addPositionTpSl that worked
  const tpPrice = String((entryPrice * 1.5).toFixed(2)); // 50% profit
  const slPrice = String((entryPrice * 0.95).toFixed(2)); // 5% loss from entry

  console.log(`   Creating BUY limit order at ${entryPrice}`);
  console.log(`   TP: ${tpPrice} (+50%), SL: ${slPrice} (-5%)`);

  const response = await callTool(
    client,
    'extended_create_limit_order_with_tpsl',
    {
      market: 'ETH-USD',
      side: side,
      qty: '0.01', // Min trade size for ETH = 0.01 ETH (same as createLimitOrder.test.js)
      price: String(entryPrice),
      post_only: false,
      reduce_only: false,
      time_in_force: 'GTT',
      expiry_epoch_millis: Date.now() + 86400000,
      take_profit: {
        trigger_price: tpPrice,
        trigger_price_type: 'LAST',
        price: tpPrice,
        price_type: 'LIMIT',
      },
      stop_loss: {
        trigger_price: slPrice,
        trigger_price_type: 'LAST',
        price: slPrice,
        price_type: 'LIMIT',
      },
    }
  );

  if (response.status !== 'success') {
    console.log(
      `⚠️  extended_create_limit_order_with_tpsl failed: ${response.error}`
    );
    return null;
  } else {
    console.log(
      '✅ extended_create_limit_order_with_tpsl test passed (with TP and SL)'
    );
    console.log('   Order ID:', response.data.id);
    return response.data;
  }
}

/**
 * Main test runner
 */
async function main() {
  console.log('Starting extended_create_limit_order_with_tpsl E2E Test...\n');

  const client = await createClient();

  try {
    const order = await testCreateLimitOrderWithTpSl(client);

    // Cancel the order to clean up
    if (order) {
      console.log('\n   Cancelling test order...');
      await callTool(client, 'extended_cancel_order', {
        order_id: String(order.id),
      });
      console.log('   Test order cancelled');
    }

    console.log('\n✅ Test completed!');
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
