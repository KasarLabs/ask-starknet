# Ask Starknet Architecture

Ask Starknet is built on a modular, AI-powered architecture that provides intelligent routing to specialized MCP servers for Starknet blockchain operations.

## Overview

The system consists of three main layers:

1. **Unified MCP Router** - AI-powered request routing
2. **Specialized MCP Servers** - Domain-specific tool execution
3. **Core Utilities** - Shared interfaces and utilities

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        User Request                         │
│                  (Natural Language Input)                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         v
┌─────────────────────────────────────────────────────────────┐
│                   Unified MCP Router                        │
│                  (packages/mcp/)                            │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  LangGraph AI-Powered Routing                         │ │
│  │  - Selector Agent: Analyzes request intent            │ │
│  │  - Specialized Agent Dispatcher: Routes to MCP        │ │
│  └───────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────────┘
                         │
                         v
         ┌───────────────┴───────────────┐
         │                               │
    ┌────v────┐                    ┌────v────┐
    │ Wallet  │                    │  DeFi   │
    │  MCPs   │                    │  MCPs   │
    └────┬────┘                    └────┬────┘
         │                               │
    ┌────v────────┐              ┌──────v──────┐
    │ • argent    │              │ • avnu      │
    │ • braavos   │              │ • ekubo     │
    │ • okx       │              │ • fibrous   │
    │ • openzeppelin│            │ • opus      │
    └─────────────┘              │ • vesu      │
                                 │ • endurfi   │
                                 │ • extended  │
                                 │ • unruggable│
                                 └─────────────┘
         │                               │
         v                               v
┌─────────────────────────────────────────────────────────────┐
│                 Starknet Blockchain                         │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. Unified MCP Router (`packages/mcp/`)

The router is the entry point that orchestrates the entire system using LangChain/LangGraph.

**Key Features:**

- **AI-Powered Analysis:** Uses LLM to understand user intent
- **Automatic Routing:** Selects the most appropriate specialized MCP
- **State Management:** Tracks conversation history and context
- **Environment Propagation:** Dynamically passes required env vars to specialized MCPs

**Required Environment Variables:**

- At least one of: `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `OPENAI_API_KEY`
- All environment variables required by specialized MCPs (dynamically loaded)

**Core Files:**

- `src/graph/graph.ts` - LangGraph workflow definition
- `src/graph/agents/selector.ts` - Agent selection logic
- `src/graph/agents/specialized.ts` - Specialized MCP execution
- `src/graph/mcps/utilities.ts` - MCP configuration loading
- `mcps.json` - Central registry of all MCPs and their configurations

### 2. Specialized MCP Servers (`packages/mcps/`)

Each specialized MCP server focuses on a specific domain or protocol.

**Standard Structure:**

```
packages/mcps/<mcp-name>/
├── src/
│   ├── tools/          # Individual tool implementations
│   ├── schemas/        # Zod validation schemas
│   ├── lib/            # Utilities, types, constants, ABIs
│   └── index.ts        # MCP server setup and tool registration
├── bin/
│   └── <mcp-name>.js   # Executable entry point
└── package.json
```

**Tool Response Format:**
All tools return JSON strings with consistent structure:

```typescript
{
  status: 'success' | 'failure',
  data?: any,        // For successful operations
  error?: string     // For failures
}
```

**Example MCPs by Domain:**

**Wallets:**

- `argent` - Argent X wallet creation and deployment
- `braavos` - Braavos wallet operations
- `okx` - OKX wallet integration
- `openzeppelin` - OpenZeppelin account contracts

**DeFi:**

- `avnu` - DEX aggregator for optimal swap routes
- `ekubo` - Concentrated liquidity AMM
- `fibrous` - Multi-DEX swap routing
- `opus` - CDP (Collateralized Debt Position) and borrowing
- `vesu` - Lending and yield farming
- `endurfi` - Liquid staking (xSTRK, xyWBTC)
- `extended` - Perpetuals trading with leverage
- `unruggable` - Memecoin creation and liquidity locking

**Blockchain Operations:**

- `erc20` - Token transfers, approvals, balances
- `erc721` - NFT operations
- `starknet-rpc` - Direct RPC calls to Starknet
- `transaction` - Transaction simulation and monitoring
- `contract` - Smart contract declaration and deployment

**Development Tools:**

- `scarb` - Cairo compilation and proving
- `cairo-coder` - AI-powered Cairo development assistance
- `ask-starknet-help` - Documentation and help system

**Special:**

- `artpeace` - Collaborative pixel art canvas

### 3. Core Package (`packages/core/`)

Provides shared utilities and interfaces used across all MCPs.

**Key Exports:**

```typescript
// Tool interface definition
export interface mcpTool<P = any> {
  name: string;
  description: string;
  schema?: z.AnyZodObject;
  execute: (params: P) => Promise<unknown>;
}

// Utility to register tools with MCP server
export function registerToolsWithServer(
  server: McpServer,
  tools: mcpTool[]
): Promise<void>;

// Onchain read utilities
export function getOnchainRead(): {
  provider: RpcProvider;
  account: Account;
};
```

## Request Flow

### Step 1: User Request

User submits a natural language request through their MCP client (e.g., Claude Desktop).

### Step 2: Router Analysis

The unified router receives the request and uses the **Selector Agent**:

```typescript
// From selector.ts
const selectorAgent = async (state) => {
  // Analyze user input with LLM
  const response = await llm.invoke([
    systemPrompt, // Contains available agents and their expertise
    userInput, // User's request
  ]);

  // Returns selected agent name or END
  return { next: selectedAgent };
};
```

### Step 3: Specialized Execution

The **Specialized Agent** loads the selected MCP and executes tools:

```typescript
// From specialized.ts
const specializedNode = async (state) => {
  // Load MCP client for selected agent
  const client = new MultiServerMCPClient({
    [agentName]: getMCPClientConfig(agentName, env),
  });

  // Get tools and bind to LLM
  const tools = await client.getTools();
  const model = llm.bindTools(tools);

  // Execute with LLM
  const response = await model.invoke(messages);

  // Execute tools if needed
  if (response.tool_calls) {
    const toolResults = await toolNode.invoke({ messages });
    const finalResponse = await model.invoke([...messages, toolResults]);
  }

  return { messages: [finalResponse] };
};
```

### Step 4: Tool Execution

The specialized MCP server executes the requested tools and returns results.

### Step 5: Response

Results are formatted and returned to the user through the router.

## Configuration Management

### MCP Registry (`packages/mcp/mcps.json`)

Central configuration file defining all available MCPs:

```json
{
  "mcp-name": {
    "client": {
      "command": "npx",
      "args": ["-y", "@kasarlabs/mcp-name-mcp"],
      "transport": "stdio",
      "env": {
        "REQUIRED_VAR": "",
        "OPTIONAL_VAR": ""
      }
    },
    "description": "What this MCP does",
    "promptInfo": {
      "expertise": "Domain expertise description",
      "tools": ["tool_name_1", "tool_name_2"]
    }
  }
}
```

### Dynamic Environment Loading

The router automatically:

1. Loads all environment variables from the host
2. Validates required variables for each MCP
3. Passes only necessary variables to each specialized MCP

```typescript
// From utilities.ts
export const getMCPClientConfig = (serverName, env) => {
  const serverInfo = getMcpInfo(serverName);
  const config = { ...serverInfo.client };

  // Inject environment variables
  for (const envVar in serverInfo.client.env) {
    if (env[envVar]) {
      config.env[envVar] = env[envVar];
    } else {
      throw new Error(`Missing: ${envVar}`);
    }
  }

  return config;
};
```

## State Management

Uses LangGraph's state annotation for type-safe state management:

```typescript
export const GraphAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  next: Annotation<AgentName>({
    reducer: (x, y) => y ?? x,
    default: () => END,
  }),
  mcpEnvironment: Annotation<MCPEnvironment>({
    reducer: (x, y) => y ?? x,
  }),
  routingInfo: Annotation<{
    reasoning?: string;
    timestamp?: string;
  }>({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({}),
  }),
});
```

## Error Handling

### Router Level

- Validates LLM API keys on startup
- Catches graph execution errors
- Returns structured error responses

### Specialized MCP Level

- Validates environment variables before initialization
- Handles tool execution errors
- Returns error status in consistent format

### Tool Level

- Input validation with Zod schemas
- Try-catch error handling
- Detailed error messages

## Extensibility

### Adding New MCPs

1. **Create the MCP server** following the standard structure
2. **Register in `mcps.json`** with configuration
3. **Update generated types** with `pnpm generate:mcps-data`
4. **Build and publish** the package

The router will automatically:

- Discover the new MCP
- Include it in routing decisions
- Load required environment variables
- Make tools available to users

## Performance Considerations

- **Lazy Loading:** MCPs are only loaded when needed
- **Caching:** LLM responses can be cached for repeated queries
- **Parallel Execution:** Independent operations can run in parallel
- **Token Optimization:** Minimal context sent to LLMs

## Security

- **Environment Isolation:** Each MCP only receives necessary env vars
- **Private Key Protection:** Never logged or exposed
- **Input Validation:** All inputs validated with Zod schemas
- **Sandboxed Execution:** MCPs run in isolated stdio processes
