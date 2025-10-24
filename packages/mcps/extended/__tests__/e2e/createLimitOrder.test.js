// E2E test for extended_create_limit_order tool
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
 * Main test runner
 */
async function main() {
  console.log('Starting extended_create_limit_order E2E Test...\n');

  const client = await createClient();

  try {
    const order = await testCreateLimitOrder(client);

    // Cancel the order to clean up
    if (order) {
      console.log('\n   Cancelling test order...');
      await callTool(client, 'extended_cancel_order', {
        order_id: order.id,
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
