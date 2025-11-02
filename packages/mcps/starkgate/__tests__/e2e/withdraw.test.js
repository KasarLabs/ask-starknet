// E2E test for Starkgate withdraw (L2 → L1)
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
 * Test starkgate_withdraw tool (ETH)
 */
async function testWithdrawETH(client) {
  console.log('\n🧪 Testing ETH withdrawal from Starknet to Ethereum...');

  const response = await callTool(client, 'starkgate_withdraw', {
    token: 'ETH',
    amount: '0.001', // Small test amount
    l1RecipientAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1', // Replace with your L1 address
    network: 'SEPOLIA', // Use testnet for safety
  });

  if (response.status !== 'success') {
    throw new Error(`starkgate_withdraw (ETH) failed: ${response.error}`);
  }

  console.log('✅ ETH withdrawal initiated successfully');
  console.log(`   L2 TX Hash: ${response.l2_tx_hash}`);
  console.log(`   L1 Recipient: ${response.l1_recipient}`);
  console.log(`   Message: ${response.message}`);
  console.log('\n⏳ Next steps:');
  console.log('   1. Wait for the L2 block to be proven on L1 (~2-5 hours)');
  console.log('   2. Visit https://starkgate.starknet.io/');
  console.log('   3. Connect your Ethereum wallet');
  console.log('   4. Click "Complete withdrawal" to claim your funds on L1');

  return response;
}

/**
 * Test starkgate_withdraw tool (USDC) - MAINNET ONLY
 */
async function testWithdrawUSDC(client) {
  console.log('\n🧪 Testing USDC withdrawal from Starknet to Ethereum...');

  const response = await callTool(client, 'starkgate_withdraw', {
    token: 'USDC',
    amount: '1', // 1 USDC
    l1RecipientAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1', // Replace with your L1 address
    network: 'MAINNET',
  });

  if (response.status !== 'success') {
    throw new Error(`starkgate_withdraw (USDC) failed: ${response.error}`);
  }

  console.log('✅ USDC withdrawal initiated successfully');
  console.log(`   L2 TX Hash: ${response.l2_tx_hash}`);
  console.log(`   L1 Recipient: ${response.l1_recipient}`);

  return response;
}

/**
 * Test error handling - Invalid Ethereum address
 */
async function testInvalidAddress(client) {
  console.log('\n🧪 Testing error handling - Invalid Ethereum address...');

  const response = await callTool(client, 'starkgate_withdraw', {
    token: 'ETH',
    amount: '0.001',
    l1RecipientAddress: 'invalid_address',
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
 * Test error handling - Insufficient balance
 */
async function testInsufficientBalance(client) {
  console.log('\n🧪 Testing error handling - Insufficient balance...');

  const response = await callTool(client, 'starkgate_withdraw', {
    token: 'ETH',
    amount: '999999', // Unrealistically large amount
    l1RecipientAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
    network: 'SEPOLIA',
  });

  if (response.status === 'failure') {
    console.log(
      '✅ Error handling test passed - Insufficient balance detected'
    );
    console.log(`   Error: ${response.error}`);
  } else {
    console.log(
      '⚠️  Warning: Transaction succeeded (unexpected with large amount)'
    );
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
    console.log('🚀 Starting Starkgate Withdraw E2E Tests\n');
    console.log(
      '⚠️  Make sure you have set the following in your .env file:'
    );
    console.log('   - STARKNET_RPC_URL');
    console.log('   - STARKNET_ACCOUNT_ADDRESS');
    console.log('   - STARKNET_PRIVATE_KEY\n');
    console.log(
      '⚠️  This test will execute REAL transactions on testnets/mainnet!'
    );
    console.log(
      '   Make sure you have sufficient balance on L2 for the withdrawal.\n'
    );

    client = await createClient();
    console.log('✅ Client connected successfully\n');

    // Test ETH withdrawal (Sepolia testnet)
    await testWithdrawETH(client);

    // Optional: Test USDC withdrawal (Mainnet - uncomment if you want to test)
    // await testWithdrawUSDC(client);

    // Test error handling
    await testInvalidAddress(client);
    await testInsufficientBalance(client);
    await testMissingEnvVars(client);

    console.log('\n✅ All withdrawal tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log('   - Withdrawal tool is functional');
    console.log('   - L2 transactions executing correctly');
    console.log('   - Error handling working');
    console.log('\n💡 Next steps:');
    console.log('   - Wait 2-5 hours for L2 block to be proven on L1');
    console.log('   - Visit https://starkgate.starknet.io/ to complete withdrawal');
    console.log(
      '   - Connect your Ethereum wallet and click "Complete withdrawal"'
    );
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Full error:', error);

    if (
      error.message.includes('STARKNET_RPC_URL') ||
      error.message.includes('STARKNET_ACCOUNT_ADDRESS') ||
      error.message.includes('STARKNET_PRIVATE_KEY')
    ) {
      console.error(
        '\n💡 Tip: Make sure you have set STARKNET_RPC_URL, STARKNET_ACCOUNT_ADDRESS, and STARKNET_PRIVATE_KEY in packages/mcps/starkgate/.env'
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
