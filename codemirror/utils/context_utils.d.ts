import { AgentContexts } from '../../lang/classes';
/** combineContexts: Identify contexts acceptable to both of two different contexts. */
export declare const combineContexts: (c1: AgentContexts, c2: AgentContexts) => AgentContexts;
/** noContext: Identify if there is no valid context. */
export declare const noContext: (context: AgentContexts) => boolean;