/**
 * Domain categorization for MCPs
 */
export const MCP_DOMAINS = {
  wallets: ['argent', 'braavos', 'okx', 'openzeppelin'],
  defi: [
    'avnu',
    'ekubo',
    'endurfi',
    'extended',
    'fibrous',
    'opus',
    'vesu',
    'unruggable',
  ],
  blockchain: ['erc20', 'erc721', 'transaction', 'starknet-rpc', 'contract'],
  'dev-tools': ['scarb', 'cairo-coder', 'ask-starknet-docs'],
  special: ['artpeace'],
} as const;

export type DomainName = keyof typeof MCP_DOMAINS;

/**
 * Domain descriptions
 */
export const DOMAIN_DESCRIPTIONS = {
  wallets:
    'Wallet creation and deployment for various Starknet wallet providers (Argent, Braavos, OKX, OpenZeppelin)',
  defi: 'DeFi protocols including DEX aggregators, AMMs, lending, liquid staking, perpetuals trading, and memecoin launches',
  blockchain:
    'Core blockchain operations for tokens (ERC20), NFTs (ERC721), transactions, RPC queries, and smart contract deployment',
  'dev-tools':
    'Development tools for Cairo compilation, project management, AI-powered Cairo assistance, and Ask Starknet documentation',
  special: 'Unique applications like collaborative pixel art on Starknet',
} as const;
