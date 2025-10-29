// client.js - Simple MCP test
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: 'node',
  args: ['build/index.js'],
});

const client = new Client({
  name: 'test-client',
  version: '1.0.0',
});

try {
  await client.connect(transport);

  // const result = await client.callTool({
  //   name: "perform_starknet_actions",
  //   arguments: {
  //     userInput: "I want to create a new Argent account, then transfer 0.2 STRK to it with my account, then deploy it"
  //   }
  // });

  const result = await client.callTool({
    name: 'ask_starknet',
    arguments: {
      userInput:
        'I want to have my balance on Extended exchange',
    },
  });

  const response = JSON.parse(result.content[0].text);
  console.log(response);
} catch (error) {
  console.error('Error:', error.message);
} finally {
  await client.close();
}
