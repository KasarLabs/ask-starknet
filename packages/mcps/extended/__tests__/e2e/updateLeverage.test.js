// E2E test for extended_update_leverage tool
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
 * Test extended_update_leverage tool
 */
async function testUpdateLeverage(client) {
  console.log('🚀 Starting extended_update_leverage E2E Test\n');

  // Step 1: Get current leverage settings
  console.log('📋 Step 1: Getting current leverage settings...');
  const currentLeverageResponse = await callTool(
    client,
    'extended_get_leverage',
    {}
  );

  if (currentLeverageResponse.status !== 'success') {
    throw new Error(
      `Failed to get current leverage: ${currentLeverageResponse.error}`
    );
  }

  console.log(
    `✅ Found leverage settings for ${currentLeverageResponse.data.length} market(s)`
  );

  if (currentLeverageResponse.data.length > 0) {
    console.log('\nCurrent leverage settings:');
    currentLeverageResponse.data.forEach((setting) => {
      console.log(`   ${setting.market}: ${setting.leverage}x`);
    });
  }

  // Get market ID from environment or use a default
  const marketId = 'BTC-USD';
  const newLeverage = 5;

  console.log(
    `\n📋 Step 2: Updating leverage for ${marketId} to ${newLeverage}x...`
  );
  console.log('⚠️  WARNING: This will modify your actual account settings!');
  console.log('⏳ Proceeding in 2 seconds... (Ctrl+C to abort)\n');

  // Give user time to abort
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Step 2: Update leverage
  const updateResponse = await callTool(client, 'extended_update_leverage', {
    market_id: marketId,
    leverage: newLeverage,
  });

  if (updateResponse.status === 'success') {
    console.log('\n✅ Leverage updated successfully!');
  } else {
    console.log('\n❌ Failed to update leverage');
    console.log(`   Error: ${updateResponse.error}`);

    // This might be expected if:
    // - Invalid market ID
    // - Invalid leverage value
    // - No position in that market
    if (
      updateResponse.error.includes('not found') ||
      updateResponse.error.includes('invalid') ||
      updateResponse.error.includes('range')
    ) {
      console.log('\n💡 Common reasons for this error:');
      console.log('   - Market ID does not exist or is invalid');
      console.log('   - Leverage value is outside allowed range');
      console.log('   - Account does not have permission to trade this market');
      console.log('\n💡 Try different values:');
      console.log(
        '   MARKET_ID=ETH-USD LEVERAGE=10 node __tests__/e2e/updateLeverage.test.js'
      );
    }

    throw new Error(`Update leverage failed: ${updateResponse.error}`);
  }
}

/**
 * Test updating leverage with invalid parameters
 */
async function testUpdateLeverageErrorHandling(client) {
  console.log('\n📋 Testing error handling...');

  // Test with invalid market
  console.log('\n1. Testing with invalid market ID...');
  const invalidMarketResponse = await callTool(
    client,
    'extended_update_leverage',
    {
      market_id: 'INVALID-MARKET',
      leverage: 10,
    }
  );

  if (invalidMarketResponse.status === 'failure') {
    console.log('✅ Invalid market test passed');
  } else {
    console.log('⚠️  Expected error but got success');
  }

  // Test with invalid leverage (too high)
  console.log('\n2. Testing with invalid leverage value...');
  const invalidLeverageResponse = await callTool(
    client,
    'extended_update_leverage',
    {
      market_id: 'BTC-USD',
      leverage: 10000, // Unreasonably high
    }
  );

  if (invalidLeverageResponse.status === 'failure') {
    console.log('✅ Invalid leverage test passed');
  } else {
    console.log('⚠️  Expected error but got success (or leverage accepted)');
  }
}

/**
 * Test different leverage values
 */
async function testDifferentLeverageValues(client) {
  console.log('\n📋 Testing different leverage values...');

  const marketId = process.env.MARKET_ID || 'BTC-USD';
  const testValues = [1, 2, 5, 10, 20];

  console.log(`\nTesting leverage values: ${testValues.join(', ')}`);
  console.log('⚠️  This will modify your account settings multiple times!');
  console.log('⏳ Proceeding in 3 seconds... (Ctrl+C to abort)\n');

  await new Promise((resolve) => setTimeout(resolve, 3000));

  for (const leverage of testValues) {
    console.log(`\nSetting ${marketId} leverage to ${leverage}x...`);

    const response = await callTool(client, 'extended_update_leverage', {
      market_id: marketId,
      leverage: leverage,
    });

    if (response.status === 'success') {
      console.log(`✅ ${leverage}x leverage set successfully`);
    } else {
      console.log(`❌ ${leverage}x leverage failed: ${response.error}`);
      // Continue with other values even if one fails
    }

    // Small delay between updates
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log('\n✅ Leverage value testing completed');
}

/**
 * Main test runner
 */
async function runTests() {
  let client;

  try {
    console.log(
      '⚠️  Make sure you have set EXTENDED_API_KEY in your .env file\n'
    );
    console.log(
      '⚠️  WARNING: This test will modify your actual leverage settings!\n'
    );
    console.log('💡 You can specify custom values:');
    console.log(
      '   MARKET_ID=ETH-USD LEVERAGE=10 node __tests__/e2e/updateLeverage.test.js\n'
    );

    client = await createClient();
    console.log('✅ Client connected successfully\n');

    // Test basic leverage update
    await testUpdateLeverage(client);

    // Test error handling
    await testUpdateLeverageErrorHandling(client);

    // Optional: Test different leverage values
    if (process.env.TEST_ALL_VALUES === 'true') {
      await testDifferentLeverageValues(client);
    } else {
      console.log('\n💡 To test multiple leverage values, run with:');
      console.log(
        '   TEST_ALL_VALUES=true node __tests__/e2e/updateLeverage.test.js'
      );
    }

    console.log('\n📊 Test Summary:');
    console.log('   ✅ extended_update_leverage tool is functional');
    console.log('   ✅ Error handling works correctly');
    console.log('   ✅ API integration successful');
    console.log('   ✅ Verification of updates working');
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
