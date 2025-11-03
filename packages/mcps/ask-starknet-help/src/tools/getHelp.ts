import { z } from 'zod';
import { getHelpSchema } from '../schemas/index.js';

/**
 * Provide help on how to use Ask Starknet
 */
export const getHelp = async (params: z.infer<typeof getHelpSchema>) => {
  try {
    const topic = params.topic || 'all';

    const helpData = {
      quickStart: {
        description:
          'Ask Starknet is simple to use - just describe what you want to do in natural language.',
        basicUsage:
          'Simply ask questions or request actions in plain English. The AI router will automatically select the right specialized agent and execute the appropriate tools.',
        examples: [
          'Check my ETH balance',
          'Swap 100 USDC for ETH on AVNU',
          'Transfer my NFT #123 to address 0x456...',
          'Create a new Argent wallet',
          'Open a long position on ETH/USD with 5x leverage',
          'Show me the liquidity in the ETH/USDC pool on Ekubo',
          'Help me implement an ERC20 token in Cairo',
        ],
      },

      setup: {
        description:
          'To use Ask Starknet, you need to configure it in your MCP client (like Claude Desktop).',
        minimalSetup: {
          description: 'Basic setup for read-only operations and queries',
          requiredEnvVars: [
            'ANTHROPIC_API_KEY or GEMINI_API_KEY or OPENAI_API_KEY - At least one LLM API key is required',
            'STARKNET_RPC_URL - Starknet RPC endpoint (optional for some operations)',
          ],
          configExample: {
            mcpServers: {
              'ask-starknet': {
                command: 'npx',
                args: ['-y', '@kasarlabs/ask-starknet-mcp'],
                env: {
                  ANTHROPIC_API_KEY: 'sk-...',
                  STARKNET_RPC_URL: 'https://your-rpc-url',
                },
              },
            },
          },
        },
        fullSetup: {
          description:
            'Complete setup for all operations including transactions',
          requiredEnvVars: [
            'ANTHROPIC_API_KEY (or GEMINI_API_KEY or OPENAI_API_KEY)',
            'STARKNET_RPC_URL',
            'STARKNET_ACCOUNT_ADDRESS - Your wallet address',
            'STARKNET_PRIVATE_KEY - Your private key for signing transactions',
          ],
          optionalEnvVars: [
            'EXTENDED_API_KEY - For perpetuals trading on Extended',
            'EXTENDED_API_URL - Extended API endpoint',
            'EXTENDED_PRIVATE_KEY - Stark key for Extended',
            'CAIRO_CODER_API_KEY - For AI-powered Cairo development assistance',
            'PATH_UPLOAD_DIR - For Artpeace pixel art',
            'SECRET_PHRASE - For Artpeace authentication',
          ],
        },
      },

      capabilities: {
        description:
          'Ask Starknet can perform a wide range of operations across different domains',
        domains: [
          {
            name: 'Wallets & Accounts',
            description:
              'Create and deploy wallets (Argent, Braavos, OKX, OpenZeppelin)',
            examples: [
              'Create a new Argent wallet',
              'Deploy my Braavos account',
            ],
          },
          {
            name: 'DeFi Operations',
            description:
              'Trade, swap, provide liquidity, lend, borrow, and stake',
            examples: [
              'Swap 100 USDC for ETH on AVNU',
              'Add liquidity to ETH/USDC pool on Ekubo',
              'Stake 10 STRK on Endurfi',
              'Borrow 500 CASH from my Opus Trove',
            ],
          },
          {
            name: 'Perpetuals Trading',
            description: 'Trade derivatives with leverage on Extended',
            examples: [
              'Open a 5x long position on ETH/USD',
              'Check my open positions on Extended',
              'Set stop-loss at $3000 for my ETH position',
            ],
          },
          {
            name: 'Token & NFT Operations',
            description: 'Manage ERC20 tokens and ERC721 NFTs',
            examples: [
              'Check my USDC balance',
              'Transfer 50 ETH to 0x123...',
              'Transfer NFT #42 to 0x456...',
              'Deploy a new ERC20 token',
            ],
          },
          {
            name: 'Smart Contract Development',
            description: 'Compile, deploy, and get help with Cairo code',
            examples: [
              'Initialize a new Cairo project',
              'Deploy my smart contract',
              'How do I implement an AMM in Cairo?',
            ],
          },
          {
            name: 'Blockchain Queries',
            description: 'Query blockchain data and transaction information',
            examples: [
              'Get the latest block number',
              'Check transaction 0xabc... status',
              'What is the current chain ID?',
            ],
          },
        ],
      },

      tips: {
        description: 'Best practices for using Ask Starknet effectively',
        bestPractices: [
          'Be specific: Include token amounts, addresses, and specific protocols when relevant',
          'Use natural language: No need to memorize tool names or parameters',
          'Ask for help: You can ask "What can you do?" or "How do I trade on Extended?"',
          'Chain operations: You can describe complex workflows (e.g., "Approve USDC then swap for ETH")',
          'Check balances first: Before transactions, ask to check your balance',
          'Environment variables: Make sure required env vars are set for the operations you need',
        ],
      },

      troubleshooting: {
        description: 'Common issues and how to resolve them',
        commonIssues: [
          {
            issue: 'Missing environment variables',
            solution:
              'Check that all required env vars are set in your MCP client configuration. At minimum, you need one LLM API key.',
          },
          {
            issue: 'Transaction operations failing',
            solution:
              'Ensure STARKNET_ACCOUNT_ADDRESS and STARKNET_PRIVATE_KEY are set for write operations.',
          },
          {
            issue: 'Specific protocol not working',
            solution:
              'Some protocols require additional API keys (e.g., Extended needs EXTENDED_API_KEY).',
          },
          {
            issue: 'Not sure what Ask Starknet can do',
            solution:
              'Use the ask_starknet_list_capabilities tool or ask "What can you help me with?"',
          },
        ],
      },
    };

    // Filter based on topic
    let responseData: any = {};

    if (topic === 'all') {
      responseData = helpData;
    } else if (topic === 'quickstart') {
      responseData = {
        quickStart: helpData.quickStart,
        tips: helpData.tips,
      };
    } else if (topic === 'setup') {
      responseData = {
        setup: helpData.setup,
      };
    } else if (topic === 'capabilities') {
      responseData = {
        capabilities: helpData.capabilities,
      };
    } else if (topic === 'troubleshooting') {
      responseData = {
        troubleshooting: helpData.troubleshooting,
      };
    }

    return {
      status: 'success',
      data: responseData,
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
