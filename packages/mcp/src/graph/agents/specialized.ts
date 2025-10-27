import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
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

  // Invoke model with system prompt + conversation history
  const response = await model.invoke([systemMessage, ...state.messages]);

  if (response.tool_calls && response.tool_calls.length > 0) {
    logger.error(
      `Tool calls detected: ${response.tool_calls.map((tc) => tc.name).join(', ')}`,
      {}
    );
    const toolResults = await toolNode.invoke({
      messages: [...state.messages, response],
    });
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

    return {
      messages: [
        new HumanMessage({
          content: finalResponse.content,
          name: state.next,
        }),
      ],
    };
  } else {
    logger.error('Agent response without tools', {
      agent: state.next,
      messageLength: response.content.length,
    });

    return {
      messages: [
        new HumanMessage({ content: response.content, name: state.next }),
      ],
    };
  }
};
