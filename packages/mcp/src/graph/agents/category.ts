import { END } from '@langchain/langgraph';
import { z } from 'zod';
import { AIMessage } from '@langchain/core/messages';

import { GraphAnnotation } from '../graph.js';
import { getMCPsByCategory, getCategoryDescription } from '../mcps/categoryUtils.js';
import { getMCPDescription } from '../mcps/mcpUtils.js';
import { logger } from '../../utils/logger.js';
import { createLLM } from '../../utils/llm.js';

export const categoryAgent = async (state: typeof GraphAnnotation.State) => {
  const category = state.next;
  const lastMessage = state.messages[state.messages.length - 1];
  const userInput = lastMessage.content;

  const categoryMcps = getMCPsByCategory(category);
  const categoryDescription = getCategoryDescription(category);

  // Create schema with category MCPs + END
  const categoryOutputSchema = z.object({
    selectedMcp: z.enum([END, ...categoryMcps] as [string, ...string[]]),
    reasoning: z.string().describe('Why this MCP was chosen'),
  });

  // Build MCP descriptions for this category
  const mcpDescriptions = categoryMcps
    .map((mcp) => `- ${mcp}: ${getMCPDescription(mcp)}`)
    .join('\n');

  const systemPrompt = `You are a specialized router for the "${category}" category.

Category: ${category}
Description: ${categoryDescription}

Available MCPs in this category:
${mcpDescriptions}

Instructions:
- Analyze the user's request
- If no MCP can handle the request in this category, choose "__end__"

IMPORTANT: Look at the conversation history.

Respond with the exact name of the chosen MCP or "__end__".`;

  // Build conversation history for context
  const conversationHistory = state.messages
    .map((msg, idx) => {
      const role = msg.name || (idx === 0 ? 'user' : 'assistant');
      const content =
        typeof msg.content === 'string'
          ? msg.content.substring(0, 500)
          : JSON.stringify(msg.content).substring(0, 500);
      return `[${role}]: ${content}`;
    })
    .join('\n\n');

  const model = createLLM(state.mcpEnvironment);
  const structuredModel = model.withStructuredOutput(categoryOutputSchema);
  const response = await structuredModel.invoke([
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `Conversation history:\n${conversationHistory}\n\nOriginal user request: "${state.messages[0].content}"\n\nCurrent message: "${userInput}"\n\nHas the original request been completed? If yes, choose "__end__".`,
    },
  ]);

  logger.error(`Category routing decision for "${category}"`, {
    selectedMcp: response.selectedMcp,
    reasoning: response.reasoning,
  });

  // If END chosen for initial request, add error message
  const isInitialRequest = state.messages.length === 1;
  const isNoMcpFound = response.selectedMcp === END;

  if (isInitialRequest && isNoMcpFound) {
    return {
      next: END,
      messages: [
        new AIMessage({
          content: `I couldn't find an appropriate MCP in the "${category}" category to handle this request: "${userInput}"\n\nPlease try rephrasing your request.`,
          name: 'category-error',
        }),
      ],
      routingInfo: {
        reasoning: response.reasoning,
        timestamp: new Date().toISOString(),
      },
    };
  }

  return {
    next: response.selectedMcp,
    routingInfo: {
      reasoning: response.reasoning,
      timestamp: new Date().toISOString(),
    },
  };
};
