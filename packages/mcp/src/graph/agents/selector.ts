import { END } from '@langchain/langgraph';
import { z } from 'zod';
import { AIMessage } from '@langchain/core/messages';

import { GraphAnnotation } from '../graph.js';
import {
  getCategories,
  getCategoryDescription,
} from '../mcps/categoryUtils.js';
import { logger } from '../../utils/logger.js';
import { createLLM } from '../../utils/llm.js';

const availableCategories = getCategories();

const selectorOutputSchema = z.object({
  selectedCategory: z.enum([END, ...availableCategories] as [
    string,
    ...string[],
  ]),
  reasoning: z.string().describe('Why this category was chosen'),
});

export const selectorAgent = async (state: typeof GraphAnnotation.State) => {
  const lastMessage = state.messages[state.messages.length - 1];
  const userInput = lastMessage.content;

  const categoryDescriptions = availableCategories
    .map((category) => `- ${category}: ${getCategoryDescription(category)}`)
    .join('\n');

  const systemPrompt = `You are a category selector for Starknet blockchain operations.

Available categories:
${categoryDescriptions}

Instructions:
- Carefully analyze the user's request
- Read each category's description and understand its scope
- **Context assumption**: All user requests should be interpreted within the Starknet ecosystem context by default
- Questions that could relate to Starknet (people, projects, protocols, concepts) should be routed to the appropriate category
- Select the MOST APPROPRIATE category that best matches the user's intent
- Choose "__end__" in two cases:
  1. Requests clearly unrelated to Starknet (general conversation, greetings with no context, completely off-topic questions)
  2. Starknet-related requests that none of the available categories can handle

Be precise and choose the single best category for this request.

Respond with the exact name of the chosen category or "__end__".`;

  const model = createLLM(state.mcpEnvironment);
  const structuredModel = model.withStructuredOutput(selectorOutputSchema);
  const response = await structuredModel.invoke([
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `User request: "${userInput}"\n\nWhich category should handle this request?`,
    },
  ]);

  logger.error(`Selector routing decision`, {
    selectedCategory: response.selectedCategory,
    reasoning: response.reasoning,
  });

  return {
    next: response.selectedCategory,
    ...(response.selectedCategory === END && {
      messages: [
        new AIMessage({
          content: `I couldn't find an appropriate category to handle this request: "${userInput}"\n\nPlease try rephrasing your request or ask "help" to see what I can do.`,
          name: 'selector-error',
        }),
      ],
    }),
    routingInfo: {
      reasoning: response.reasoning,
      timestamp: new Date().toISOString(),
    },
  };
};
