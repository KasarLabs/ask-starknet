# Creating New MCPs

## Project Structure

```
packages/mcps/your-mcp/
├── src/
│   ├── tools/
│   │   ├── action1.ts      # Individual tool functions
│   │   └── action2.ts
│   ├── schemas/
│   │   └── index.ts        # Zod schemas
│   ├── lib/                # Utils, types, constants, abis
│   └── index.ts            # MCP server + tool registration
├── bin/
│   └── yourname-mcp.js
└── package.json
```

## Tool Functions (src/tools/action.ts)

```typescript
import { z } from 'zod';
import { yourSchema } from '../schemas/index.js';

export const yourAction = async (
  params: z.infer<typeof yourSchema>
): Promise<string> => {
  try {
    // Your logic here
    const result = await doSomething(params);

    return {
      status: 'success',
      data: result,
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
```

## Schemas (src/schemas/index.ts)

```typescript
import { z } from 'zod';

export const yourSchema = z.object({
  param1: z.string().describe('Parameter description'),
  param2: z.number().optional(),
});
```

## MCP Server (src/index.ts)

```typescript
#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { mcpTool, registerToolWithServer } from '@ask-starknet/core';
import { yourAction } from './tools/action.js';
import { yourSchema } from './schemas/index.js';

const server = new McpServer({
  name: 'starknet-yourname',
  version: '1.0.0',
});

const tools: mcpTool[] = [
  {
    name: 'your_action_name',
    description: 'What this tool does',
    schema: yourSchema,
    execute: async (params: any) => {
      return await yourAction(params);
    },
  },
];

async function main() {
  const transport = new StdioServerTransport();

  // Register all tools using the core utility
  await registerToolWithServer(server, tools);

  await server.connect(transport);
  console.error('Your MCP Server running on stdio');
}

main().catch(console.error);
```

## Register in packages/mcps/mcps.json

```json
{
  "yourname": {
    "client": {
      "command": "node",
      "args": ["build/index.js"],
      "transport": "stdio",
      "env": {
        "STARKNET_RPC_URL": "",
        "CUSTOM_VARIABLE": ""
      }
    },
    "description": "What this MCP handles",
    "promptInfo": {
      "expertise": "Your domain",
      "tools": ["your_action_name"]
    }
  }
}
```

## Executable (bin/yourname-mcp.js)

```javascript
#!/usr/bin/env node
import('../build/index.js').catch(console.error);
```

## Environment Variables

The MCP system now supports dynamic environment variable loading. Each MCP can specify required environment variables in the `packages/mcps/mcps.json` configuration.

### Environment Variable Configuration

Environment variables are configured in the `packages/mcps/mcps.json` file under each MCP's `client.env` section:

```json
{
  "your-mcp": {
    "client": {
      "command": "node",
      "args": ["build/index.js"],
      "transport": "stdio",
      "env": {
        "STARKNET_RPC_URL": "",
        "CUSTOM_VARIABLE": ""
      }
    }
  }
}
```

The MCP system will dynamically load and validate these environment variables when building MCP clients, ensuring all required variables are provided before initialization.
