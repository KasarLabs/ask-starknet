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
  const externalId = `test-limit-${Date.now()}`;

  const response = await callTool(client, 'extended_create_limit_order', {
    external_id: externalId,
    market: 'ETH-USD',
    side: 'BUY',
    qty: '1',
    price: '50000',
    post_only: false,
    reduce_only: false,
    time_in_force: 'GTC',
  });

  if (response.status !== 'success') {
    console.log(`⚠️  extended_create_limit_order failed (expected if no STARKNET_PRIVATE_KEY): ${response.error}`);
  } else {
    console.log('✅ extended_create_limit_order test passed');
  }

  return response;
}

/**
 * Test extended_create_market_order tool
 */
async function testCreateMarketOrder(client) {
  const externalId = `test-market-${Date.now()}`;

  const response = await callTool(client, 'extended_create_market_order', {
    external_id: externalId,
    market: 'ARB-USD',
    side: 'BUY',
    qty: '10', // Min trade size for BTC-USD is 0.0001 BTC (~4-5 USD notional value)
    reduce_only: false,
  });

  if (response.status !== 'success') {
    console.log(`⚠️  extended_create_market_order failed (expected if no STARKNET_PRIVATE_KEY): ${response.error}`);
  } else {
    console.log('✅ extended_create_market_order test passed');
  }

  return response;
}

/**
 * Main test runner
 */
async function main() {
  console.log('Starting Extended MCP Write Tools E2E Tests...\n');

  const client = await createClient();

  try {
    // Test order creation tools (these require STARKNET_PRIVATE_KEY)
    // await testCreateLimitOrder(client);
    await testCreateMarketOrder(client);

    console.log('\n✅ All write tool tests completed!');
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
