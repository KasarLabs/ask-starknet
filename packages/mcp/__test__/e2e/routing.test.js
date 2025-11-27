import 'dotenv/config';
import { selectorAgent } from '../../build/graph/agents/selector.js';
import { categoryAgent } from '../../build/graph/agents/category.js';
import { HumanMessage, AIMessage } from '@langchain/core/messages';

// Comprehensive routing test cases: Selector -> Category -> MCP
const testCases = [
  // Wallet Account Tests
  {
    name: 'Argent Account Creation',
    query: 'I want to create a new Argent account',
    expectedCategory: 'wallet',
    expectedMCP: 'argent',
  },
  {
    name: 'Braavos Account Deploy',
    query: 'Deploy my existing Braavos account',
    expectedCategory: 'wallet',
    expectedMCP: 'braavos',
  },
  {
    name: 'OKX Account Setup',
    query: 'Create an OKX wallet account',
    expectedCategory: 'wallet',
    expectedMCP: 'okx',
  },

  // ERC20 Token Tests
  {
    name: 'ERC20 Transfer',
    query: 'Transfer 100 USDC to another address',
    expectedCategory: 'tokens',
    expectedMCP: 'erc20',
  },
  {
    name: 'ERC20 Balance Check',
    query: "What's my ETH balance?",
    expectedCategory: 'tokens',
    expectedMCP: 'erc20',
  },
  {
    name: 'ERC20 Approval',
    query: 'Approve spending of my tokens',
    expectedCategory: 'tokens',
    expectedMCP: 'erc20',
  },

  // NFT/ERC721 Tests
  {
    name: 'NFT Transfer',
    query: 'Transfer my NFT to another wallet',
    expectedCategory: 'tokens',
    expectedMCP: 'erc721',
  },
  {
    name: 'NFT Balance',
    query: 'How many NFTs do I own?',
    expectedCategory: 'tokens',
    expectedMCP: 'erc721',
  },

  // DEX/Swapping Tests
  {
    name: 'AVNU Token Swap',
    query: 'Swap ETH for USDC on AVNU',
    expectedCategory: 'defi',
    expectedMCP: 'avnu',
  },
  {
    name: 'Fibrous Exchange',
    query: 'Use Fibrous to exchange tokens',
    expectedCategory: 'defi',
    expectedMCP: 'fibrous',
  },

  // DeFi Protocol Tests
  {
    name: 'Vesu Deposit',
    query: 'Deposit tokens to earn yield on Vesu',
    expectedCategory: 'defi',
    expectedMCP: 'vesu',
  },
  {
    name: 'Vesu Withdrawal',
    query: 'Withdraw my earnings from Vesu protocol',
    expectedCategory: 'defi',
    expectedMCP: 'vesu',
  },

  // Development & Contract Tests
  {
    name: 'Contract Declaration',
    query: 'Declare a smart contract on Starknet',
    expectedCategory: 'development',
    expectedMCP: 'contract',
  },
  {
    name: 'Contract Deployment',
    query: 'Deploy my compiled contract',
    expectedCategory: 'development',
    expectedMCP: 'contract',
  },
  {
    name: 'Cairo Compilation',
    query: 'Build my Scarb project',
    expectedCategory: 'development',
    expectedMCP: 'scarb',
  },

  // Blockchain Data Tests
  {
    name: 'Block Information',
    query: 'Get the latest block number',
    expectedCategory: 'data',
    expectedMCP: 'starknet-rpc',
  },
  {
    name: 'Launch Token on Ekubo',
    query: 'Launch my memecoin on Ekubo DEX',
    expectedCategory: 'defi',
    expectedMCP: 'unruggable',
  },

  // Edge Cases & Invalid Queries
  {
    name: 'Invalid Query - Weather',
    query: "What's the weather today?",
    expectedCategory: '__end__',
    expectedMCP: null,
  },
  {
    name: 'Invalid Query - Empty',
    query: '',
    expectedCategory: '__end__',
    expectedMCP: null,
  },
  {
    name: 'Greeting - No Context',
    query: 'Hey there, how are you?',
    expectedCategory: '__end__',
    expectedMCP: null,
  },
  {
    name: 'Starknet Person Question',
    query: 'Who is Vitalik Buterin?',
    expectedCategory: 'knowledge',
    expectedMCP: 'starknet-docs',
  },
];

async function testRouting() {
  console.log('🧪 Testing Selector -> Category -> MCP Routing\n');

  let passed = 0;
  let failed = 0;

  // Mock environment with required MODEL_NAME
  const mockEnv = {
    MODEL_NAME: process.env.MODEL_NAME || 'claude-sonnet-4-20250514',
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY
  };

  for (const testCase of testCases) {
    try {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Testing: ${testCase.name}`);
      console.log(`Query: "${testCase.query}"`);
      console.log(`Expected Category: ${testCase.expectedCategory}`);
      console.log(`Expected MCP: ${testCase.expectedMCP || 'N/A'}`);

      // Step 1: Test selector agent (selects category)
      const selectorState = {
        messages: [new HumanMessage(testCase.query)],
        next: '',
        mcpEnvironment: mockEnv,
      };

      const selectorResult = await selectorAgent(selectorState);
      const selectedCategory = selectorResult.next;

      console.log(`\n[Selector] Selected Category: ${selectedCategory}`);

      // Check if category matches
      if (selectedCategory !== testCase.expectedCategory) {
        console.log(`❌ FAIL - Category mismatch`);
        console.log(`   Expected: ${testCase.expectedCategory}`);
        console.log(`   Got: ${selectedCategory}`);
        failed++;
        continue;
      }

      console.log(`✅ Category match`);

      // If expected to end, stop here
      if (testCase.expectedCategory === '__end__') {
        console.log('✅ PASS - Correctly routed to __end__\n');
        passed++;
        continue;
      }

      // Step 2: Test category agent (selects MCP)
      const categoryState = {
        messages: [
          new HumanMessage(testCase.query),
          new AIMessage({
            content: `Routing to category: ${selectedCategory}`,
            name: 'selector',
          }),
        ],
        next: selectedCategory,
        mcpEnvironment: mockEnv,
      };

      const categoryResult = await categoryAgent(categoryState);
      const selectedMCP = categoryResult.next;

      console.log(`[Category] Selected MCP: ${selectedMCP}`);

      // Check if MCP matches
      if (selectedMCP !== testCase.expectedMCP) {
        console.log(`❌ FAIL - MCP mismatch`);
        console.log(`   Expected: ${testCase.expectedMCP}`);
        console.log(`   Got: ${selectedMCP}`);
        failed++;
        continue;
      }

      console.log(`✅ MCP match`);
      console.log('✅ PASS - Full routing successful');
      passed++;
    } catch (error) {
      console.log(`\n❌ ERROR: ${error.message}`);
      console.error(error.stack);
      failed++;
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 Results: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    console.log('\n🚨 Routing errors detected!');
    process.exit(1);
  } else {
    console.log('\n✨ All routing tests passed!');
  }
}

// Run the test
testRouting().catch((error) => {
  console.error('Test runner error:', error);
  process.exit(1);
});
