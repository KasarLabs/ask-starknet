import 'dotenv/config';
import { selectorAgent } from '../../build/graph/agents/selector.js';
import { HumanMessage } from '@langchain/core/messages';

// Comprehensive routing test cases for all MCPs
const testCases = [
  // Wallet Account Tests
  {
    name: 'Argent Account Creation',
    query: 'I want to create a new Argent account',
    expectedAgent: 'argent',
  },
  {
    name: 'Braavos Account Deploy',
    query: 'Deploy my existing Braavos account',
    expectedAgent: 'braavos',
  },
  {
    name: 'OKX Account Setup',
    query: 'Create an OKX wallet account',
    expectedAgent: 'okx',
  },
  {
    name: 'OpenZeppelin Account',
    query: 'I need a new OpenZeppelin account',
    expectedAgent: 'openzeppelin',
  },

  // ERC20 Token Tests
  {
    name: 'ERC20 Transfer',
    query: 'Transfer 100 USDC to another address',
    expectedAgent: 'erc20',
  },
  {
    name: 'ERC20 Balance Check',
    query: "What's my ETH balance?",
    expectedAgent: 'erc20',
  },
  {
    name: 'ERC20 Approval',
    query: 'Approve spending of my tokens',
    expectedAgent: 'erc20',
  },
  {
    name: 'Token Allowance Check',
    query: 'Check my token allowance for this contract',
    expectedAgent: 'erc20',
  },

  // NFT/ERC721 Tests
  {
    name: 'NFT Transfer',
    query: 'Transfer my NFT to another wallet',
    expectedAgent: 'erc721',
  },
  {
    name: 'NFT Balance',
    query: 'How many NFTs do I own?',
    expectedAgent: 'erc721',
  },
  {
    name: 'Deploy NFT Contract',
    query: 'Create a new ERC721 contract',
    expectedAgent: 'erc721',
  },
  {
    name: 'NFT Approval',
    query: 'Approve someone to manage my NFT',
    expectedAgent: 'erc721',
  },

  // DEX/Swapping Tests
  {
    name: 'AVNU Token Swap',
    query: 'Swap ETH for USDC on AVNU',
    expectedAgent: 'avnu',
  },
  {
    name: 'Fibrous Exchange',
    query: 'Use Fibrous to exchange tokens',
    expectedAgent: 'fibrous',
  },
  {
    name: 'Batch Swap Fibrous',
    query: 'Do a batch swap on Fibrous DEX',
    expectedAgent: 'fibrous',
  },
  {
    name: 'Get Swap Route',
    query: "What's the best route for swapping USDC to ETH?",
    expectedAgent: 'avnu', // Could be avnu or fibrous, depends on routing logic
  },

  // DeFi Protocol Tests
  {
    name: 'Vesu Deposit',
    query: 'Deposit tokens to earn yield on Vesu',
    expectedAgent: 'vesu',
  },
  {
    name: 'Vesu Withdrawal',
    query: 'Withdraw my earnings from Vesu protocol',
    expectedAgent: 'vesu',
  },
  {
    name: 'Troves Strategies',
    query: 'Get Troves strategies',
    expectedAgent: 'troves',
  },
  {
    name: 'Troves Yield Farming',
    query: 'Show me available strategies on Troves',
    expectedAgent: 'troves',
  },
  {
    name: 'Opus Trove',
    query: 'Open a Trove on Opus for borrowing',
    expectedAgent: 'opus',
  },
  {
    name: 'Opus Lending',
    query: 'Borrow CASH using Opus protocol',
    expectedAgent: 'opus',
  },
  {
    name: 'Trove Health Check',
    query: 'Check my Trove health status',
    expectedAgent: 'opus',
  },

  // Development & Contract Tests
  {
    name: 'Contract Declaration',
    query: 'Declare a smart contract on Starknet',
    expectedAgent: 'contract',
  },
  {
    name: 'Contract Deployment',
    query: 'Deploy my compiled contract',
    expectedAgent: 'contract',
  },
  {
    name: 'Cairo Compilation',
    query: 'Build my Scarb project',
    expectedAgent: 'scarb',
  },
  {
    name: 'Install Scarb',
    query: 'Install the Scarb toolchain',
    expectedAgent: 'scarb',
  },
  {
    name: 'Execute Cairo Program',
    query: 'Run my Cairo program',
    expectedAgent: 'scarb',
  },

  // Blockchain Data Tests
  {
    name: 'Block Information',
    query: 'Get the latest block number',
    expectedAgent: 'starknet-rpc',
  },
  {
    name: 'Launch Token on Ekubo',
    query: 'Launch my memecoin on Ekubo DEX',
    expectedAgent: 'unruggable',
  },
  {
    name: 'Check Liquidity Lock',
    query: "Is this token's liquidity locked?",
    expectedAgent: 'unruggable',
  },

  // Edge Cases & Invalid Queries
  {
    name: 'Invalid Query - Weather',
    query: "What's the weather today?",
    expectedAgent: '__end__',
  },
  {
    name: 'Invalid Query - Empty',
    query: '',
    expectedAgent: '__end__',
  },
  {
    name: 'Ambiguous Query',
    query: 'Help me with blockchain',
    expectedAgent: '__end__',
  },
  {
    name: 'Unclear Request',
    query: 'Do something with my tokens',
    expectedAgent: '__end__',
  },
  {
    name: 'Random Text',
    query: 'asdfgh qwerty keyboard',
    expectedAgent: '__end__',
  },
];

async function testRouting() {
  console.log('🧪 Testing MCP Routing Logic\n');

  let passed = 0;
  let failed = 0;

  // Mock environment with required MODEL_NAME
  const mockEnv = {
    MODEL_NAME: process.env.MODEL_NAME || 'claude-sonnet-4-20250514',
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  };

  for (const testCase of testCases) {
    try {
      console.log(`Testing: ${testCase.name}`);
      console.log(`Query: "${testCase.query}"`);

      // Create test state
      const state = {
        messages: [new HumanMessage(testCase.query)],
        next: '',
        mcpEnvironment: mockEnv,
      };

      // Test selector agent
      const result = await selectorAgent(state);
      const selectedAgent = result.next;

      console.log(`Expected: ${testCase.expectedAgent}`);
      console.log(`Got: ${selectedAgent}`);

      if (selectedAgent === testCase.expectedAgent) {
        console.log('✅ PASS\n');
        passed++;
      } else {
        console.log('❌ FAIL\n');
        failed++;
      }
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}\n`);
      failed++;
    }
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

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
