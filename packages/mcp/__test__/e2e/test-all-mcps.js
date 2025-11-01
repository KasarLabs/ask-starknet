#!/usr/bin/env node
// Test all MCP servers to ensure they can be launched via npx and list tools

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load mcps.json configuration
const mcpsConfigPath = join(__dirname, '../../mcps.json');
const mcpsConfig = JSON.parse(readFileSync(mcpsConfigPath, 'utf-8'));

// Simple queries for each MCP (read-only operations that don't require private keys)
const testQueries = {
  argent: {
    tool: 'create_new_argent_account',
    description: 'Create Argent account',
  },
  erc20: {
    tool: 'erc20_get_balance',
    description: 'Get ERC20 balance',
    args: {
      token_address:
        '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
      account_address: '0x1',
    },
  },
  braavos: {
    tool: 'create_new_braavos_account',
    description: 'Create Braavos account',
  },
  avnu: {
    tool: 'avnu_get_route',
    description: 'Get AVNU route',
    args: {
      sell_token_address:
        '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
      buy_token_address:
        '0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8',
      sell_amount: '1000000000000000000',
    },
  },
  erc721: {
    tool: 'erc721_get_balance',
    description: 'Get ERC721 balance',
    args: { contract_address: '0x1', owner: '0x1' },
  },
  transaction: {
    tool: 'simulate_transaction',
    description: 'Simulate transaction',
  },
  artpeace: { tool: 'place_pixel', description: 'Place pixel' },
  contract: {
    tool: 'get_constructor_params',
    description: 'Get constructor params',
    args: { contract_path: './test.cairo' },
  },
  fibrous: {
    tool: 'fibrous_get_route',
    description: 'Get Fibrous route',
    args: {
      token_in_address:
        '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
      token_out_address:
        '0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8',
      amount: '1000000000000000000',
    },
  },
  okx: { tool: 'create_new_okx_account', description: 'Create OKX account' },
  openzeppelin: {
    tool: 'create_new_openzeppelin_account',
    description: 'Create OpenZeppelin account',
  },
  opus: {
    tool: 'get_user_troves',
    description: 'Get user troves',
    args: { user_address: '0x1' },
  },
  'starknet-rpc': { tool: 'get_chain_id', description: 'Get chain ID' },
  scarb: { tool: 'install_scarb', description: 'Install Scarb' },
  unruggable: {
    tool: 'is_memecoin',
    description: 'Check if memecoin',
    args: { token_address: '0x1' },
  },
  vesu: { tool: 'vesu_deposit_earn', description: 'Deposit on Vesu' },
  ekubo: {
    tool: 'get_pool_info',
    description: 'Get pool info',
    args: {
      token0:
        '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
      token1:
        '0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8',
      fee: '170141183460469235273462165868118016',
    },
  },
  extended: { tool: 'extended_get_markets', description: 'Get markets' },
  endurfi: {
    tool: 'get_total_staked',
    description: 'Get total staked',
    args: { pool: 'xstrk' },
  },
  'cairo-coder': {
    tool: 'starknet_general_knowledge',
    description: 'Starknet knowledge',
    args: { question: 'What is Starknet?' },
  },
  troves: {
    tool: 'troves_get_strategies',
    description: 'Get Troves strategies',
  },
};

async function testMCP(mcpName, mcpConfig) {
  console.log(`\n🧪 Testing ${mcpName}...`);

  const client = new Client({
    name: 'test-client',
    version: '1.0.0',
  });

  try {
    // Create transport using npx with -y flag
    const transport = new StdioClientTransport({
      command: mcpConfig.client.command,
      args: mcpConfig.client.args,
      env: {
        ...process.env,
        // Set dummy values for required env vars to avoid errors during connection
        STARKNET_RPC_URL:
          process.env.STARKNET_RPC_URL ||
          'https://starknet-mainnet.public.blastapi.io',
        STARKNET_ACCOUNT_ADDRESS: process.env.STARKNET_ACCOUNT_ADDRESS || '0x1',
        STARKNET_PRIVATE_KEY: process.env.STARKNET_PRIVATE_KEY || '0x1',
        EXTENDED_API_KEY: process.env.EXTENDED_API_KEY || 'test',
        EXTENDED_API_URL:
          process.env.EXTENDED_API_URL ||
          'https://api.starknet.extended.exchange',
        EXTENDED_PRIVATE_KEY: process.env.EXTENDED_PRIVATE_KEY || '0x1',
        CAIRO_CODER_API_KEY: process.env.CAIRO_CODER_API_KEY || 'test',
        PATH_UPLOAD_DIR: process.env.PATH_UPLOAD_DIR || '/tmp',
        SECRET_PHRASE: process.env.SECRET_PHRASE || 'test',
      },
    });

    // Connect to the MCP server
    await client.connect(transport);
    console.log(`  ✅ Connection established`);

    // List available tools
    const tools = await client.listTools();
    console.log(`  ✅ Tools available: ${tools.tools.length} tools`);

    // Show first few tool names
    const toolNames = tools.tools
      .slice(0, 3)
      .map((t) => t.name)
      .join(', ');
    console.log(
      `  📋 Sample tools: ${toolNames}${tools.tools.length > 3 ? '...' : ''}`
    );

    // Verify expected tool exists (if defined in testQueries)
    const testConfig = testQueries[mcpName];
    if (testConfig && testConfig.tool) {
      const hasExpectedTool = tools.tools.some(
        (t) => t.name === testConfig.tool
      );
      if (hasExpectedTool) {
        console.log(`  ✅ Expected tool "${testConfig.tool}" found`);
      } else {
        console.log(`  ⚠️  Expected tool "${testConfig.tool}" not found`);
      }
    }

    await client.close();
    return { success: true, toolCount: tools.tools.length };
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    try {
      await client.close();
    } catch (closeError) {
      // Ignore close errors
    }
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 Testing all MCP servers via npx...\n');
  console.log('This will download and test each MCP package from npm.\n');

  const results = {};
  const mcpNames = Object.keys(mcpsConfig);

  for (const mcpName of mcpNames) {
    const mcpConfig = mcpsConfig[mcpName];
    const result = await testMCP(mcpName, mcpConfig);
    results[mcpName] = result;

    // Small delay between tests to avoid overwhelming npm
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary\n');

  const successful = Object.entries(results).filter(([_, r]) => r.success);
  const failed = Object.entries(results).filter(([_, r]) => !r.success);

  console.log(`✅ Successful: ${successful.length}/${mcpNames.length}`);
  successful.forEach(([name, result]) => {
    console.log(`   - ${name} (${result.toolCount} tools)`);
  });

  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}/${mcpNames.length}`);
    failed.forEach(([name, result]) => {
      console.log(`   - ${name}: ${result.error}`);
    });
  }

  console.log('\n' + '='.repeat(60));

  if (failed.length > 0) {
    console.log('\n⚠️  Some MCP servers failed to load!');
    process.exit(1);
  } else {
    console.log('\n✅ All MCP servers are working correctly!');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
