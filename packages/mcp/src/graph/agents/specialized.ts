import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import {
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from '@langchain/core/messages';
import { ToolNode } from '@langchain/langgraph/prebuilt';

import { getMCPClientConfig, getMCPPromptInfo } from '../mcps/utilities.js';
import { GraphAnnotation } from '../graph.js';
import { logger } from '../../utils/logger.js';
import { MCPEnvironment } from '../mcps/interfaces.js';
import { createLLM } from '../../utils/llm.js';
import { specializedPrompt } from './prompts.js';

async function specializedAgent(mcpServerName: string, env: MCPEnvironment) {
  const client = new MultiServerMCPClient({
    mcpServers: {
      [mcpServerName]: getMCPClientConfig(mcpServerName, env),
    },
  });

  const tools = await client.getTools();
  logger.error(
    `Loaded ${tools.length} MCP tools: ${tools
      .map((tool) => tool.name)
      .join(', ')}`,
    {}
  );

  const llm = createLLM(env);

  if (!llm.bindTools) {
    throw new Error('The selected LLM model does not support tool binding');
  }

  const model = llm.bindTools(tools);
  const toolNode = new ToolNode(tools);

  return { model, toolNode };
}

export const specializedNode = async (state: typeof GraphAnnotation.State) => {
  logger.error(`Specialized node executing for agent: ${state.next}`, {});

  const { model, toolNode } = await specializedAgent(
    state.next,
    state.mcpEnvironment
  );

  // Get prompt info and create system message
  const promptInfo = getMCPPromptInfo(state.next);
  const systemPrompt = specializedPrompt(promptInfo);
  const systemMessage = new SystemMessage(systemPrompt);

  // Build conversation with all messages
  const allMessages = [systemMessage, ...state.messages];

  let currentResponse = await model.invoke(allMessages);
  let iterationCount = 0;

  // Keep executing tools until there are no more tool calls
  while (currentResponse.tool_calls && currentResponse.tool_calls.length > 0) {
    iterationCount++;
    const toolResults = await toolNode.invoke({
      messages: [...state.messages, currentResponse],
    });

    if (state.rawTools) {
      logger.info('Raw tools flag is set, returning tool results directly');
      return { messages: [response].concat(toolResults.messages) };
    }
    const finalResponse = await model.invoke([
      ...state.messages,
      response,
      ...toolResults.messages,
    ]);

    logger.error('Agent response with tools completed', {
      agent: state.next,
      toolCalls: response.tool_calls,
      toolResults: toolResults,
      toolArgs: response.tool_calls[0].args,
      toolArgsType: typeof response.tool_calls[0].args,
    });

    // Normalize content to string
    let contentString: string;
    if (Array.isArray(finalResponse.content)) {
      contentString = finalResponse.content
        .map((block: any) => block.text || block.content || '')
        .join('');
    } else {
      contentString = String(finalResponse.content);
    }
    allMessages.push(currentResponse);
    allMessages.push(...toolResults.messages);
    logger.info(
      `🔄 [Iteration ${iterationCount}] Invoking LLM again with updated context`,
      {
        totalMessages: allMessages.length,
      }
    );
    currentResponse = await model.invoke(allMessages);
  }

  // Normalize final content to string
  let contentString: string;
  if (Array.isArray(currentResponse.content)) {
    contentString = currentResponse.content
      .map((block: any) => block.text || block.content || '')
      .join('');
  } else {
    contentString = String(currentResponse.content);
  }

  return {
    messages: [
      new HumanMessage({
        content: contentString,
        name: state.next,
      }),
    ],
  };
};
