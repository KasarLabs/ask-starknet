import {
  StateGraph,
  MemorySaver,
  Annotation,
  START,
  END,
} from '@langchain/langgraph';
import type { BaseMessage } from '@langchain/core/messages';

import { selectorAgent } from './agents/selector.js';
import { AgentName } from './mcps/utilities.js';
import { MCPEnvironment } from './mcps/interfaces.js';
import { specializedNode } from './agents/specialized.js';
import { logger } from '../utils/logger.js';

export const GraphAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  next: Annotation<AgentName>({
    reducer: (x, y) => y ?? x,
    default: () => END as AgentName,
  }),
  mcpEnvironment: Annotation<MCPEnvironment>({
    reducer: (x, y) => y ?? x,
  }),
  routingInfo: Annotation<{
    reasoning?: string;
    timestamp?: string;
  }>({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({}),
  }),
});

export const routingFunction = async (state: typeof GraphAnnotation.State) => {
  return state.next != END ? 'specialized' : END;
};

export const graph = new StateGraph(GraphAnnotation)
  .addNode('selector', selectorAgent)
  .addNode('specialized', specializedNode)
  .addEdge(START, 'selector')
  .addConditionalEdges('selector', routingFunction)
  .addEdge('specialized', END)
  .compile({ checkpointer: new MemorySaver() });
