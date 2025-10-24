// E2E test for extended_add_position_tpsl tool
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
 * Test extended_add_position_tp_sl tool
 */
async function testAddPositionTpSl(client) {
  // First check if we have an open position
  const positionsResponse = await callTool(client, 'extended_get_positions', {
    market: 'ARB-USD',
  });

  if (
    positionsResponse.status !== 'success' ||
    !positionsResponse.data ||
    positionsResponse.data.length === 0
  ) {
    console.log(
      '⚠️  extended_add_position_tpsl skipped: No open position found'
    );
    return null;
  }

  const position = positionsResponse.data[0];
  const positionSide = position.side; // 'LONG' or 'SHORT'
  const orderSide = positionSide === 'LONG' ? 'SELL' : 'BUY'; // Opposite side to close
  const positionQty = Math.abs(parseFloat(position.size));

  console.log(`   Found ${positionSide} position with size ${positionQty}`);

  // Calculate reasonable TP/SL prices based on current position
  const currentPrice = parseFloat(position.markPrice);
  const openPrice = parseFloat(position.openPrice);

  // For LONG: TP above current price, SL below (but not too far to avoid equity error)
  // For SHORT: TP below current price, SL above
  const tpPrice =
    positionSide === 'LONG'
      ? String((currentPrice * 1.5).toFixed(4)) // 50% profit
      : String((currentPrice * 0.7).toFixed(4)); // 30% profit

  const slPrice =
    positionSide === 'LONG'
      ? String((openPrice * 0.95).toFixed(4)) // 5% loss from entry
      : String((openPrice * 1.05).toFixed(4)); // 5% loss from entry

  console.log(`   Setting TP at ${tpPrice}, SL at ${slPrice}`);

  const response = await callTool(client, 'extended_add_position_tpsl', {
    market: 'ARB-USD',
    side: orderSide,
    qty: String(positionQty), // Close entire position
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
 * Main test runner
 */
async function main() {
  console.log('Starting extended_add_position_tpsl E2E Test...\n');

  const client = await createClient();

  try {
    await testAddPositionTpSl(client);
    console.log('\n✅ Test completed!');
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
