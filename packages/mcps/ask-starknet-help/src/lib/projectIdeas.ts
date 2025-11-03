/**
 * Project ideas that can be built with Ask Starknet
 */

export interface ProjectIdea {
  name: string;
  description: string;
  domain: string;
  requiredMCPs: string[];
  features: string[];
}

export const PROJECT_IDEAS: ProjectIdea[] = [
  // DeFi Projects
  {
    name: 'Token Portfolio Tracker',
    description:
      'Real-time portfolio tracking application that monitors ERC20 token balances across multiple wallets and displays total value',
    domain: 'defi',
    requiredMCPs: ['erc20', 'starknet-rpc'],
    features: [
      'Track multiple wallet addresses',
      'Display token balances and prices',
      'Calculate total portfolio value',
      'Historical balance tracking',
      'Price alerts and notifications',
    ],
  },
  {
    name: 'Multi-DEX Swap Aggregator',
    description:
      'DEX aggregator that finds the best swap routes across multiple decentralized exchanges (AVNU, Ekubo, Fibrous)',
    domain: 'defi',
    requiredMCPs: ['avnu', 'ekubo', 'fibrous', 'erc20'],
    features: [
      'Compare swap rates across multiple DEXes',
      'Execute swaps on the best DEX',
      'Display liquidity pools and fees',
      'Slippage protection',
      'Transaction history',
    ],
  },
  {
    name: 'Automated Yield Optimizer',
    description:
      'Smart yield farming bot that automatically moves funds between Vesu, Opus, and Endurfi to maximize returns',
    domain: 'defi',
    requiredMCPs: ['vesu', 'opus', 'endurfi', 'erc20'],
    features: [
      'Monitor APY across multiple protocols',
      'Automatic fund rebalancing',
      'Compound earnings automatically',
      'Risk assessment and management',
      'Yield performance analytics',
    ],
  },
  {
    name: 'Trading Bot with Alerts',
    description:
      'Automated perpetuals trading bot with custom strategies and risk management on Extended',
    domain: 'trading',
    requiredMCPs: ['extended', 'erc20', 'starknet-rpc'],
    features: [
      'Multiple trading strategies (DCA, grid, momentum)',
      'Position management with TP/SL',
      'Real-time price alerts',
      'Leverage management',
      'PnL tracking and reporting',
      'Backtesting capabilities',
    ],
  },
  {
    name: 'Liquidation Monitor & Bot',
    description:
      'Monitor lending positions across protocols and execute liquidations or protect your own positions',
    domain: 'defi',
    requiredMCPs: ['opus', 'vesu', 'extended', 'erc20'],
    features: [
      'Real-time health factor monitoring',
      'Liquidation opportunity alerts',
      'Automatic position protection',
      'Liquidation execution bot',
      'Risk analytics dashboard',
    ],
  },
  {
    name: 'Cross-Protocol Position Manager',
    description:
      'Unified dashboard to manage DeFi positions across multiple protocols from a single interface',
    domain: 'defi',
    requiredMCPs: [
      'avnu',
      'ekubo',
      'opus',
      'vesu',
      'endurfi',
      'extended',
      'erc20',
    ],
    features: [
      'Unified position overview',
      'One-click position management',
      'Cross-protocol analytics',
      'Rebalancing recommendations',
      'Gas optimization',
    ],
  },

  // NFT Projects
  {
    name: 'NFT Gallery & Transfer Tool',
    description:
      'Beautiful NFT gallery viewer with batch transfer capabilities and metadata display',
    domain: 'nft',
    requiredMCPs: ['erc721', 'starknet-rpc'],
    features: [
      'Display owned NFTs with metadata',
      'Batch transfer NFTs',
      'NFT collection analytics',
      'Rarity tracking',
      'Transfer history',
    ],
  },

  // Memecoins & Tokens
  {
    name: 'Memecoin Launcher Platform',
    description:
      'No-code platform for launching memecoins with automatic liquidity locking and Ekubo integration',
    domain: 'defi',
    requiredMCPs: ['unruggable', 'ekubo', 'erc20'],
    features: [
      'One-click memecoin creation',
      'Automatic liquidity provision',
      'Liquidity locking mechanism',
      'Fair launch options',
      'Token analytics dashboard',
    ],
  },

  // Development Tools
  {
    name: 'Smart Contract Deployment Pipeline',
    description:
      'CI/CD pipeline for Cairo smart contracts with compilation, testing, and deployment automation',
    domain: 'automation',
    requiredMCPs: ['scarb', 'contract', 'starknet-rpc'],
    features: [
      'Automated compilation workflow',
      'Contract deployment automation',
      'Version management',
      'Deployment verification',
      'Multi-network support',
    ],
  },
  {
    name: 'AI-Powered Cairo Assistant',
    description:
      'Interactive Cairo development assistant with code generation, explanations, and Starknet knowledge',
    domain: 'dev-tools',
    requiredMCPs: ['cairo-coder', 'scarb'],
    features: [
      'Code generation and completion',
      'Cairo best practices suggestions',
      'Smart contract auditing assistance',
      'Starknet ecosystem knowledge',
      'Interactive learning tutorials',
    ],
  },

  // Wallet & Account Management
  {
    name: 'Wallet Analytics Dashboard',
    description:
      'Comprehensive analytics dashboard for Starknet wallets with transaction history and insights',
    domain: 'analytics',
    requiredMCPs: [
      'argent',
      'braavos',
      'okx',
      'openzeppelin',
      'starknet-rpc',
      'erc20',
      'erc721',
    ],
    features: [
      'Multi-wallet support',
      'Transaction history analysis',
      'Token and NFT portfolio',
      'Gas spending analytics',
      'Wallet comparison tools',
    ],
  },
  {
    name: 'Bulk Wallet Operations Tool',
    description:
      'Execute bulk operations across multiple wallets (airdrops, batch transfers, multi-sig coordination)',
    domain: 'automation',
    requiredMCPs: ['erc20', 'erc721', 'transaction', 'starknet-rpc'],
    features: [
      'Batch token transfers',
      'Airdrop distribution',
      'CSV import/export',
      'Transaction simulation before execution',
      'Progress tracking',
    ],
  },

  // Gaming & Social
  {
    name: 'Collaborative Pixel Art Game',
    description:
      'Interactive pixel art canvas where users can collaboratively create art on Starknet',
    domain: 'gaming',
    requiredMCPs: ['artpeace', 'erc20'],
    features: [
      'Real-time collaborative drawing',
      'Pixel ownership tracking',
      'Voting mechanisms for art',
      'NFT minting of completed art',
      'Community governance',
    ],
  },

  // Analytics & Monitoring
  {
    name: 'DeFi Protocol Monitor',
    description:
      'Real-time monitoring dashboard for DeFi protocol metrics, TVL, volumes, and user activity',
    domain: 'analytics',
    requiredMCPs: ['avnu', 'ekubo', 'opus', 'vesu', 'endurfi', 'starknet-rpc'],
    features: [
      'Protocol TVL tracking',
      'Volume and fee analytics',
      'User activity metrics',
      'Historical data visualization',
      'Custom alerts and notifications',
    ],
  },
  {
    name: 'Gas Price Optimizer',
    description:
      'Monitor Starknet gas prices and suggest optimal times for transaction execution',
    domain: 'automation',
    requiredMCPs: ['starknet-rpc', 'transaction'],
    features: [
      'Real-time gas price tracking',
      'Historical gas analysis',
      'Optimal transaction timing suggestions',
      'Automatic transaction queuing',
      'Gas cost predictions',
    ],
  },

  // Advanced Trading
  {
    name: 'Arbitrage Bot',
    description:
      'Detect and execute arbitrage opportunities across DEXes and perpetual exchanges',
    domain: 'trading',
    requiredMCPs: ['avnu', 'ekubo', 'fibrous', 'extended', 'erc20'],
    features: [
      'Real-time arbitrage detection',
      'Multi-DEX route optimization',
      'Spot vs perpetual arbitrage',
      'Automatic execution',
      'Profitability tracking',
    ],
  },
  {
    name: 'Options Trading Simulator',
    description:
      'Simulate options trading strategies using perpetuals and spot markets',
    domain: 'trading',
    requiredMCPs: ['extended', 'avnu', 'erc20'],
    features: [
      'Synthetic options creation',
      'Strategy backtesting',
      'Greeks calculation',
      'Risk visualization',
      'Paper trading mode',
    ],
  },
];
