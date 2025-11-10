// client.js - Simple MCP test
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: 'npx',
  args: ['-y', '@kasarlabs/ask-starknet-mcp@latest'],
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
      userInput: 'can you bridge my fund with starkgate?',
    },
  });
  const response = JSON.parse(result.content[0].text);
  console.log(response);

  const result2 = await client.callTool({
    name: 'ask_starknet',
    arguments: {
      userInput: 'help',
    },
  });

  const response2 = JSON.parse(result2.content[0].text);
  console.log(response2);

  const result3 = await client.callTool({
    name: 'ask_starknet',
    arguments: {
      userInput: 'how can i use ask-starknet to build a project in defi',
    },
  });
  const response3 = JSON.parse(result3.content[0].text);
  console.log(response3);
} catch (error) {
  console.error('Error:', error.message);
} finally {
  await client.close();
}
