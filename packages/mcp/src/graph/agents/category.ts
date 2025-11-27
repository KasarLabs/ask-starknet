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

  const categoryOutputSchema = z.object({
    selectedMcp: z.enum([END, ...categoryMcps] as [string, ...string[]]),
    reasoning: z.string().describe('Why this MCP was chosen'),
  });

  const mcpDescriptions = categoryMcps
    .map((mcp) => `- ${mcp}: ${getMCPDescription(mcp)}`)
    .join('\n');

  const systemPrompt = `You are a specialized MCP router for the "${category}" category on Starknet.

Category: ${category}
Description: ${categoryDescription}

Available MCPs in this category:
${mcpDescriptions}

Instructions:
- Carefully analyze the user's request and its specific requirements
- Read each MCP's description and understand its capabilities
- Select the MOST APPROPRIATE MCP that best matches the user's intent
- If the request mentions a specific protocol/service name, prioritize that MCP
- If no MCP in this category can handle the request, choose "__end__"

Be precise and choose the single best MCP for this request.

Respond with the exact name of the chosen MCP or "__end__".`;

  const model = createLLM(state.mcpEnvironment);
  const structuredModel = model.withStructuredOutput(categoryOutputSchema);
  const response = await structuredModel.invoke([
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `User request: "${userInput}"\n\nWhich MCP should handle this request?`,
    },
  ]);

  logger.error(`Category routing decision for "${category}"`, {
    selectedMcp: response.selectedMcp,
    reasoning: response.reasoning,
  });

  return {
    next: response.selectedMcp,
    ...(response.selectedMcp === END && {
        messages: [
        new AIMessage({
            content: `No MCP found in "${category}" category for: "${userInput}"`,
            name: 'category-error',
        }),
        ],
    }),
    routingInfo: {
        reasoning: response.reasoning,
        timestamp: new Date().toISOString(),
    },
  };
};
