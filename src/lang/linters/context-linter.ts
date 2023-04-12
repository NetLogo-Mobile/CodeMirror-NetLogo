import { Diagnostic } from '@codemirror/lint';
import { Localized } from '../../editor';
import { Linter } from './linter-builder';
import { Procedure, CodeBlock, LintContext } from '../classes';
import {
  combineContexts,
  noContext,
} from '../../codemirror/utils/context-utils';

// ContextLinter: Checks if procedures and code blocks have a valid context
export const ContextLinter: Linter = (view, preprocessContext, lintContext) => {
  const diagnostics: Diagnostic[] = [];
  for (let p of lintContext.Procedures.values()) {
    diagnostics.push(...checkProcedureContents(p, lintContext));
  }
  return diagnostics;
};

// checkProcedureContents: Checks contents of procedures and codeblocks for valid context
const checkProcedureContents = function (
  p: Procedure | CodeBlock,
  lintContext: LintContext
) {
  let diagnostics: Diagnostic[] = [];
  // checks if current procedure/code block has at least one valid context
  if (noContext(p.Context)) {
    diagnostics.push({
      from: p.PositionStart,
      to: p.PositionEnd,
      severity: 'error',
      message: Localized.Get(
        'Invalid context _.',
        p instanceof Procedure ? 'procedure' : 'code block'
      ),
    });
  } else {
    // checks nested anonymous procedures and codeblocks for valid context
    for (let a of p.AnonymousProcedures) {
      diagnostics.push(...checkProcedureContents(a, lintContext));
    }
    for (let c of p.CodeBlocks) {
      diagnostics.push(...checkProcedureContents(c, lintContext));
      if (
        c.InheritParentContext &&
        noContext(combineContexts(c.Context, p.Context))
      ) {
        diagnostics.push({
          from: c.PositionStart,
          to: c.PositionEnd,
          severity: 'error',
          message: Localized.Get('Invalid context _.'),
        });
      }
    }
  }
  return diagnostics;
};
