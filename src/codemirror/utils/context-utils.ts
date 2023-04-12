import { AgentContexts } from '../../lang/classes';

/** combineContexts: Identify contexts acceptable to both of two different contexts. */
export const combineContexts = function (c1: AgentContexts, c2: AgentContexts) {
  let final = new AgentContexts();
  if (!c1.Observer || !c2.Observer) {
    final.Observer = false;
  }
  if (!c1.Turtle || !c2.Turtle) {
    final.Turtle = false;
  }
  if (!c1.Patch || !c2.Patch) {
    final.Patch = false;
  }
  if (!c1.Link || !c2.Link) {
    final.Link = false;
  }
  return final;
};

/** noContext: Identify if there is no valid context. */
export const noContext = function (context: AgentContexts) {
  return (
    !context.Observer && !context.Turtle && !context.Patch && !context.Link
  );
};
