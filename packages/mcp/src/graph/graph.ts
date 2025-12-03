import {
  StateGraph,
  MemorySaver,
  Annotation,
  START,
  END,
  messagesStateReducer,
} from '@langchain/langgraph';
import type { BaseMessage } from '@langchain/core/messages';

import { selectorAgent } from './agents/selector.js';
import { AgentName } from './mcps/mcpUtils.js';
import { MCPEnvironment } from './mcps/interfaces.js';
import { specializedNode } from './agents/specialized.js';
import { logger } from '../utils/logger.js';
import { categoryAgent } from './agents/category.js';

export const GraphAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
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
  rawTools: Annotation<boolean>({
    reducer: (x, y) => y ?? x,
    default: () => false,
  }),
});

export const routingSelector = async (state: typeof GraphAnnotation.State) => {
  return state.next != END ? 'category' : END;
};

export const routingCategory = async (state: typeof GraphAnnotation.State) => {
  return state.next != END ? 'specialized' : END;
};

export const graph = new StateGraph(GraphAnnotation)
  .addNode('selector', selectorAgent)
  .addNode('category', categoryAgent)
  .addNode('specialized', specializedNode)
  .addEdge(START, 'selector')
  .addConditionalEdges('selector', routingSelector)
  .addConditionalEdges('category', routingCategory)
  .addEdge('specialized', END)
  .compile({ checkpointer: new MemorySaver() });
