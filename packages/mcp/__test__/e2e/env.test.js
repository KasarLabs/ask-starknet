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
        'can you transfer 0.000001 ETH to 0x0590612320bCC4C7735007e67674902969b9A0F9546B786BDeA46b11Cca8c5AC?',
    },
  });

  const response = JSON.parse(result.content[0].text);
  console.log(response);
} catch (error) {
  console.error('Error:', error.message);
} finally {
  await client.close();
}
