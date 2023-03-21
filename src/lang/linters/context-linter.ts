import { syntaxTree } from '@codemirror/language';
import { Diagnostic } from '@codemirror/lint';
import { Localized } from '../../i18n/localized';
import { buildLinter } from './linter-builder';
import { AgentContexts, Procedure, CodeBlock } from '../classes';
import { StateNetLogo } from '../../codemirror/extension-state-netlogo';
import {
  combineContexts,
  noContext,
} from '../../codemirror/utils/context_utils';

//Checks if procedures and code blocks have a valid context
export const ContextLinter = buildLinter((view, parseState) => {
  const diagnostics: Diagnostic[] = [];
  for (let p of parseState.Procedures.values()) {
    diagnostics.push(...checkProcedureContents(p, parseState));
  }
  return diagnostics;
});

const checkProcedureContents = function (
  p: Procedure | CodeBlock,
  parseState: StateNetLogo
) {
  let diagnostics: Diagnostic[] = [];
  //checks if current procedure/code block has at least one valid context
  if (noContext(p.Context)) {
    diagnostics.push({
      from: p.PositionStart,
      to: p.PositionEnd,
      severity: 'error',
      message: Localized.Get(
        'Invalid context _.',
        p.isProcedure ? 'procedure' : 'code block'
      ),
    });
  } else {
    //checks nested anonymous procedures and codeblocks for valid context
    for (let a of p.AnonymousProcedures) {
      diagnostics.push(...checkProcedureContents(a, parseState));
    }
    for (let c of p.CodeBlocks) {
      diagnostics.push(...checkProcedureContents(c, parseState));
      if (
        c.InheritParentContext &&
        noContext(combineContexts(c.Context, p.Context))
      ) {
        diagnostics.push({
          from: c.PositionStart,
          to: c.PositionEnd,
          severity: 'error',
          message: Localized.Get('Invalid context _.', 'code block'),
        });
      }
    }
  }
  return diagnostics;
};

// const checkValidContext = function (c: AgentContexts) {
//   return c.Observer || c.Turtle || c.Patch || c.Link;
// };
