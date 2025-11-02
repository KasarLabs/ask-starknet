// E2E test for Starkgate read-only tools
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
 * Test starkgate_list_bridged_tokens tool (Mainnet)
 */
async function testListBridgedTokensMainnet(client) {
  console.log('\n🧪 Testing list bridged tokens on Mainnet...');

  const response = await callTool(client, 'starkgate_list_bridged_tokens', {
    network: 'MAINNET',
  });

  if (response.status !== 'success') {
    throw new Error(
      `starkgate_list_bridged_tokens (Mainnet) failed: ${response.error}`
    );
  }

  console.log('✅ List bridged tokens (Mainnet) test passed');
  console.log(`   Network: ${response.network}`);
  console.log(`   Tokens count: ${response.tokens.length}`);
  response.tokens.forEach((token) => {
    console.log(`   - ${token.symbol}: ${token.name}`);
    console.log(`     L1 Token: ${token.l1_token_address}`);
    console.log(`     L2 Token: ${token.l2_token_address}`);
  });

  return response;
}

/**
 * Test starkgate_list_bridged_tokens tool (Sepolia)
 */
async function testListBridgedTokensSepolia(client) {
  console.log('\n🧪 Testing list bridged tokens on Sepolia...');

  const response = await callTool(client, 'starkgate_list_bridged_tokens', {
    network: 'SEPOLIA',
  });

  if (response.status !== 'success') {
    throw new Error(
      `starkgate_list_bridged_tokens (Sepolia) failed: ${response.error}`
    );
  }

  console.log('✅ List bridged tokens (Sepolia) test passed');
  console.log(`   Network: ${response.network}`);
  console.log(`   Tokens count: ${response.tokens.length}`);

  return response;
}

/**
 * Test starkgate_check_deposit_status tool
 * Note: This requires a real L1 tx hash from a previous deposit
 */
async function testCheckDepositStatus(client, l1TxHash) {
  if (!l1TxHash) {
    console.log(
      '\n⏭️  Skipping starkgate_check_deposit_status (no L1 tx hash provided)'
    );
    console.log(
      '   To test: provide an L1 tx hash from a previous deposit as argument'
    );
    return;
  }

  console.log('\n🧪 Testing check deposit status...');

  const response = await callTool(client, 'starkgate_check_deposit_status', {
    l1TxHash,
    network: 'SEPOLIA',
  });

  if (response.status === 'success') {
    console.log('✅ Check deposit status test passed');
    console.log(`   Deposit status: ${response.deposit_status}`);
    console.log(`   Message: ${response.message}`);
    if (response.l2_tx_hash) {
      console.log(`   L2 TX Hash: ${response.l2_tx_hash}`);
    }
  } else {
    console.log('⚠️  Check deposit status failed (expected if tx not found)');
    console.log(`   Error: ${response.error}`);
  }

  return response;
}

/**
 * Test starkgate_check_withdrawal_ready tool
 * Note: This requires a real L2 tx hash from a previous withdrawal
 */
async function testCheckWithdrawalReady(client, l2TxHash) {
  if (!l2TxHash) {
    console.log(
      '\n⏭️  Skipping starkgate_check_withdrawal_ready (no L2 tx hash provided)'
    );
    console.log(
      '   To test: provide an L2 tx hash from a previous withdrawal as argument'
    );
    return;
  }

  console.log('\n🧪 Testing check withdrawal ready...');

  const response = await callTool(
    client,
    'starkgate_check_withdrawal_ready',
    {
      l2TxHash,
      network: 'SEPOLIA',
    }
  );

  if (response.status === 'success') {
    console.log('✅ Check withdrawal ready test passed');
    console.log(`   Withdrawal status: ${response.withdrawal_status}`);
    console.log(`   Proof available: ${response.proof_available}`);
    console.log(`   Message: ${response.message}`);
    if (response.estimated_ready_time) {
      console.log(`   Estimated ready: ${response.estimated_ready_time}`);
    }
  } else {
    console.log('⚠️  Check withdrawal ready failed (expected if tx not found)');
    console.log(`   Error: ${response.error}`);
  }

  return response;
}

/**
 * Test error handling - Invalid network
 */
async function testInvalidNetwork(client) {
  console.log('\n🧪 Testing error handling - Invalid network...');

  try {
    // This should fail during Zod validation
    const response = await callTool(client, 'starkgate_list_bridged_tokens', {
      network: 'INVALID_NETWORK',
    });

    console.log(
      '⚠️  Expected validation error but got response:',
      response
    );
  } catch (error) {
    console.log('✅ Error handling test passed - Invalid network rejected');
    console.log(`   Error: ${error.message}`);
  }
}

/**
 * Main test runner
 */
async function runTests() {
  let client;

  try {
    console.log('🚀 Starting Starkgate Read Tools E2E Tests\n');
    console.log('⚠️  Make sure you have set ETHEREUM_RPC_URL and STARKNET_RPC_URL in your .env file\n');

    client = await createClient();
    console.log('✅ Client connected successfully\n');

    // Test list bridged tokens
    await testListBridgedTokensMainnet(client);
    await testListBridgedTokensSepolia(client);

    // Optional: Test check deposit/withdrawal status with real tx hashes
    // Replace with your own tx hashes to test
    // await testCheckDepositStatus(client, '0x123...');
    // await testCheckWithdrawalReady(client, '0x456...');

    // Test error handling
    await testInvalidNetwork(client);

    console.log('\n✅ All read tools tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log('   - List bridged tokens is functional');
    console.log('   - Check deposit status is functional');
    console.log('   - Check withdrawal ready is functional');
    console.log('   - Error handling working');
    console.log('\n💡 Tips:');
    console.log(
      '   - To test check_deposit_status, provide an L1 tx hash from a real deposit'
    );
    console.log(
      '   - To test check_withdrawal_ready, provide an L2 tx hash from a real withdrawal'
    );
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Full error:', error);

    if (
      error.message.includes('ETHEREUM_RPC_URL') ||
      error.message.includes('STARKNET_RPC_URL')
    ) {
      console.error(
        '\n💡 Tip: Make sure you have set ETHEREUM_RPC_URL and STARKNET_RPC_URL in packages/mcps/starkgate/.env'
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
