# Ask Starknet Help Guide

Welcome to Ask Starknet! This guide will help you get started with using Ask Starknet's comprehensive Model Context Protocol (MCP) servers for Starknet blockchain applications.

## What is Ask Starknet?

Ask Starknet is a unified MCP router that provides intelligent, AI-powered routing to specialized MCP servers. Simply describe what you want to do in natural language, and the AI router automatically selects the right specialized agent and executes the appropriate tools.

## Quick Start

### Basic Usage

Just ask questions or request actions in plain English. The AI router will automatically select the right specialized agent and execute the appropriate tools.

**Example requests:**
- "Check my ETH balance"
- "Swap 100 USDC for ETH on AVNU"
- "Transfer my NFT #123 to address 0x456..."
- "Create a new Argent wallet"
- "Open a long position on ETH/USD with 5x leverage"
- "Show me the liquidity in the ETH/USDC pool on Ekubo"
- "Help me implement an ERC20 token in Cairo"

### How It Works

1. **You make a request** in natural language
2. **AI Router analyzes** your request and selects the best specialized MCP agent
3. **Specialized agent executes** the appropriate tools for your request
4. **You receive** a clear response with results or transaction hashes

## Setup Instructions

To use Ask Starknet, you need to configure it in your MCP client (like Claude Desktop).

### Minimal Setup (Read-Only Operations)

For basic queries and read-only operations:

**Required Environment Variables:**
- `ANTHROPIC_API_KEY` or `GEMINI_API_KEY` or `OPENAI_API_KEY` - At least one LLM API key is required
- `STARKNET_RPC_URL` - Starknet RPC endpoint (optional for some operations)

**Configuration Example:**
```json
{
  "mcpServers": {
    "ask-starknet": {
      "command": "npx",
      "args": ["-y", "@kasarlabs/ask-starknet-mcp"],
      "env": {
        "ANTHROPIC_API_KEY": "sk-...",
        "STARKNET_RPC_URL": "https://your-rpc-url"
      }
    }
  }
}
```

### Full Setup (All Operations Including Transactions)

For complete functionality including transaction signing:

**Required Environment Variables:**
- `ANTHROPIC_API_KEY` (or `GEMINI_API_KEY` or `OPENAI_API_KEY`)
- `STARKNET_RPC_URL`
- `STARKNET_ACCOUNT_ADDRESS` - Your wallet address
- `STARKNET_PRIVATE_KEY` - Your private key for signing transactions

**Optional Environment Variables:**
- `EXTENDED_API_KEY` - For perpetuals trading on Extended
- `EXTENDED_API_URL` - Extended API endpoint
- `EXTENDED_PRIVATE_KEY` - Stark key for Extended
- `CAIRO_CODER_API_KEY` - For AI-powered Cairo development assistance
- `PATH_UPLOAD_DIR` - For Artpeace pixel art
- `SECRET_PHRASE` - For Artpeace authentication

**Model Selection:**
- `MODEL_NAME` - Specify which LLM model to use (optional, defaults based on API key provider)
  - Default for Anthropic: `claude-sonnet-4-20250514`
  - Default for Gemini: `gemini-2.5-flash`
  - Default for OpenAI: `gpt-4o-mini`

## Best Practices

**Be specific:** Include token amounts, addresses, and specific protocols when relevant
- ✅ "Swap 100 USDC for ETH on AVNU"
- ❌ "Swap tokens"

**Use natural language:** No need to memorize tool names or parameters
- ✅ "What's the latest block number?"
- ❌ "Execute get_block_number"

**Ask for help:** You can ask "What can you do?" or "How do I trade on Extended?"

**Chain operations:** You can describe complex workflows
- "Approve USDC then swap for ETH"

**Check balances first:** Before transactions, ask to check your balance
- "Check my USDC balance, then swap 100 USDC for ETH"

**Environment variables:** Make sure required env vars are set for the operations you need

## Troubleshooting

### Missing Environment Variables

**Problem:** Error about missing environment variables

**Solution:** Check that all required env vars are set in your MCP client configuration. At minimum, you need one LLM API key.

### Transaction Operations Failing

**Problem:** Cannot execute transactions or sign operations

**Solution:** Ensure `STARKNET_ACCOUNT_ADDRESS` and `STARKNET_PRIVATE_KEY` are set for write operations.

### Specific Protocol Not Working

**Problem:** Extended, Cairo Coder, or Artpeace operations failing

**Solution:** Some protocols require additional API keys (e.g., Extended needs `EXTENDED_API_KEY`, Cairo Coder needs `CAIRO_CODER_API_KEY`).

### Not Sure What Ask Starknet Can Do

**Problem:** Want to know available capabilities

**Solution:** Use the `ask_starknet_list_capabilities` tool or ask "What can you help me with?"

## Support

For more detailed information:
- **Architecture:** Ask "Explain Ask Starknet architecture"
- **Capabilities:** Ask "List all Ask Starknet capabilities"
- **Project Ideas:** Ask "Suggest projects I can build with Ask Starknet"
- **Documentation:** Visit [docs.kasar.io](https://docs.kasar.io)
- **GitHub:** [github.com/KasarLabs/ask-starknet](https://github.com/KasarLabs/ask-starknet)
