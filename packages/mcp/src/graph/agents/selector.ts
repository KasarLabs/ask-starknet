import { END } from '@langchain/langgraph';
import { z } from 'zod';
import { AIMessage } from '@langchain/core/messages';

import { GraphAnnotation } from '../graph.js';
import { AvailableAgents, getMCPDescription } from '../mcps/utilities.js';
import { logger } from '../../utils/logger.js';
import { createLLM } from '../../utils/llm.js';

const selectorOutputSchema = z.object({
  selectedAgent: z.enum([END, ...AvailableAgents] as [string, ...string[]]),
  reasoning: z.string().describe('Why this agent was chosen'),
});

export const selectorAgent = async (state: typeof GraphAnnotation.State) => {
  const lastMessage = state.messages[state.messages.length - 1];
  const userInput = lastMessage.content;

  const agentDescriptions = AvailableAgents.map(
    (agent) => `- ${agent}: ${getMCPDescription(agent)}`
  ).join('\n');

  const systemPrompt = `You are a supervisor that routes requests to specialized agents.

Available agents:
${agentDescriptions}

Instructions:
- Analyze the user's request
- If the user's original request has been COMPLETED by a previous agent response, choose "__end__"
- If a previous agent has already provided a complete answer or completed the requested action, choose "__end__"
- Only choose a specialized agent if the request is NEW or INCOMPLETE
- If no agent can handle the request, choose "__end__"


IMPORTANT: Look at the conversation history. If an agent has already successfully completed the user's request (like creating an account, providing information, etc.), you MUST choose "__end__" to stop the conversation.

Respond with the exact name of the chosen agent or "__end__".`;

  // Build conversation history for context
  const conversationHistory = state.messages
    .map((msg, idx) => {
      const role = msg.name || (idx === 0 ? 'user' : 'assistant');
      const content =
        typeof msg.content === 'string'
          ? msg.content.substring(0, 500) // Limit to avoid token overflow
          : JSON.stringify(msg.content).substring(0, 500);
      return `[${role}]: ${content}`;
    })
    .join('\n\n');

  const model = createLLM(state.mcpEnvironment);
  const structuredModel = model.withStructuredOutput(selectorOutputSchema);
  const response = await structuredModel.invoke([
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `Conversation history:\n${conversationHistory}\n\nOriginal user request: "${state.messages[0].content}"\n\nCurrent message: "${userInput}"\n\nHas the original request been completed? If yes, choose "__end__".`,
    },
  ]);

  logger.error(`Routing decision`, {
    selectedAgent: response.selectedAgent,
    reasoning: response.reasoning,
  });

  // If END chosen for initial request (no previous agent response), add error message
  const isInitialRequest = state.messages.length === 1;
  const isNoAgentFound = response.selectedAgent === END;

  if (isInitialRequest && isNoAgentFound) {
    return {
      next: END,
      messages: [
        new AIMessage({
          content: `I couldn't find an appropriate specialized agent to handle this request: "${userInput}"\n\nReasoning: ${response.reasoning}\n\nPlease try rephrasing your request or use one of the available capabilities. You can ask "help" to see what I can do.`,
          name: 'selector-error',
        }),
      ],
      routingInfo: {
        reasoning: response.reasoning,
        timestamp: new Date().toISOString(),
      },
    };
  }

  return {
    next: response.selectedAgent,
    routingInfo: {
      reasoning: response.reasoning,
      timestamp: new Date().toISOString(),
    },
  };
};
