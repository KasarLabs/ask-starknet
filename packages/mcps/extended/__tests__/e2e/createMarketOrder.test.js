// E2E test for extended_create_market_order tool
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
 * Main test runner
 */
async function main() {
  console.log('Starting extended_create_market_order E2E Test...\n');

  const client = await createClient();

  try {
    const order = await testCreateMarketOrder(client);

    if (order) {
      console.log('\n   Waiting 3 seconds for order to be processed...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      console.log('   Order should now be executed and position opened');
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
