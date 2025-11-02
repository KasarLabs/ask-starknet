// E2E test for Starkgate deposit (L1 → L2)
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
 * Test starkgate_deposit tool (ETH)
 */
async function testDepositETH(client) {
  console.log('\n🧪 Testing ETH deposit to Starknet...');

  const response = await callTool(client, 'starkgate_deposit', {
    token: 'ETH',
    amount: '0.001', // Small test amount
    l2RecipientAddress:
      '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
    network: 'SEPOLIA', // Use testnet for safety
  });

  if (response.status !== 'success') {
    throw new Error(`starkgate_deposit (ETH) failed: ${response.error}`);
  }

  console.log('✅ ETH deposit test passed');
  console.log(`   L1 TX Hash: ${response.l1_tx_hash}`);
  console.log(`   L2 Recipient: ${response.l2_recipient}`);
  console.log(`   Estimated arrival: ${response.estimated_l2_arrival}`);

  return response;
}

/**
 * Test starkgate_deposit tool (USDC) - MAINNET ONLY
 */
async function testDepositUSDC(client) {
  console.log('\n🧪 Testing USDC deposit to Starknet...');

  const response = await callTool(client, 'starkgate_deposit', {
    token: 'USDC',
    amount: '1', // 1 USDC
    l2RecipientAddress:
      '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
    network: 'MAINNET',
  });

  if (response.status !== 'success') {
    throw new Error(`starkgate_deposit (USDC) failed: ${response.error}`);
  }

  console.log('✅ USDC deposit test passed');
  console.log(`   L1 TX Hash: ${response.l1_tx_hash}`);
  console.log(`   L2 Recipient: ${response.l2_recipient}`);

  return response;
}

/**
 * Test error handling - Invalid Starknet address
 */
async function testInvalidAddress(client) {
  console.log('\n🧪 Testing error handling - Invalid address...');

  const response = await callTool(client, 'starkgate_deposit', {
    token: 'ETH',
    amount: '0.001',
    l2RecipientAddress: 'invalid_address',
    network: 'SEPOLIA',
  });

  if (response.status === 'failure') {
    console.log('✅ Error handling test passed - Invalid address rejected');
    console.log(`   Error: ${response.error}`);
  } else {
    throw new Error('Expected failure but got success');
  }

  return response;
}

/**
 * Test error handling - Missing environment variables
 */
async function testMissingEnvVars(client) {
  console.log(
    '\n🧪 Testing error handling - Missing environment variables...'
  );

  // This test will fail if env vars are missing
  // Just check that the tool provides a clear error message

  console.log('⏭️  Skipping (requires missing env vars setup)');
}

/**
 * Main test runner
 */
async function runTests() {
  let client;

  try {
    console.log('🚀 Starting Starkgate Deposit E2E Tests\n');
    console.log(
      '⚠️  Make sure you have set the following in your .env file:'
    );
    console.log('   - ETHEREUM_PRIVATE_KEY');
    console.log('   - ETHEREUM_RPC_URL\n');
    console.log(
      '⚠️  This test will execute REAL transactions on testnets/mainnet!'
    );
    console.log('   Make sure you have sufficient ETH for gas fees.\n');

    client = await createClient();
    console.log('✅ Client connected successfully\n');

    // Test ETH deposit (Sepolia testnet)
    await testDepositETH(client);

    // Optional: Test USDC deposit (Mainnet - uncomment if you want to test)
    // await testDepositUSDC(client);

    // Test error handling
    await testInvalidAddress(client);
    await testMissingEnvVars(client);

    console.log('\n✅ All deposit tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log('   - Deposit tool is functional');
    console.log('   - L1 transactions executing correctly');
    console.log('   - Error handling working');
    console.log('\n💡 Next steps:');
    console.log(
      '   - Wait 10-15 minutes for funds to arrive on Starknet L2'
    );
    console.log('   - Check balance on L2 using Starknet explorer');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Full error:', error);

    if (
      error.message.includes('ETHEREUM_PRIVATE_KEY') ||
      error.message.includes('ETHEREUM_RPC_URL')
    ) {
      console.error(
        '\n💡 Tip: Make sure you have set ETHEREUM_PRIVATE_KEY and ETHEREUM_RPC_URL in packages/mcps/starkgate/.env'
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
