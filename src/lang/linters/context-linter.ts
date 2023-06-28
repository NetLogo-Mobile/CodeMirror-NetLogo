import { Diagnostic } from '@codemirror/lint';
import { Localized } from '../../editor';
import { Linter, getDiagnostic } from './linter-builder';
import { Procedure, CodeBlock, AgentContexts } from '../classes/structures';
import { LintContext } from '../classes/contexts';
import { combineContexts, noContext } from '../../utils/context-utils';
import { stateExtension } from '../../codemirror/extension-state-netlogo';
import { syntaxTree } from '@codemirror/language';

/** ContextLinter: Checks if procedures and code blocks have a valid context. */
export const ContextLinter: Linter = (view, preprocessContext, lintContext) => {
  const diagnostics: Diagnostic[] = [];
  // for (let p of lintContext.Procedures.values()) {
  //   diagnostics.push(...checkProcedureContents(p, lintContext));
  // }
  let stateNetLogo = view.state.field(stateExtension);
  if (stateNetLogo.Mode == 'Oneline' || stateNetLogo.Mode == 'OnelineReporter') {
    let context = new AgentContexts('O---');
    for (var b of lintContext.Breeds.values()) {
      if (b.Plural == stateNetLogo.Context) context = stateNetLogo.getBreedContext(b);
    }
    stateNetLogo.getNewContext(
      syntaxTree(view.state).cursor().node.firstChild?.firstChild ?? syntaxTree(view.state).cursor().node,
      context,
      view.state,
      new AgentContexts()
    );
  }
  for (let c of stateNetLogo.ContextErrors) {
    diagnostics.push(
      getDiagnostic(
        view,
        { from: c.From, to: c.To },
        'Invalid context _',
        'error',
        contextToString(c.PriorContext),
        contextToString(c.ConflictingContext),
        c.Primitive
      )
    );
  }

  return diagnostics;
};

// contextToString: Converts context to string
const contextToString = function (context: AgentContexts) {
  let contexts: string[] = [];
  if (context.Observer) contexts.push(Localized.Get('Observer'));
  if (context.Turtle) contexts.push(Localized.Get('Turtle'));
  if (context.Patch) contexts.push(Localized.Get('Patch'));
  if (context.Link) contexts.push(Localized.Get('Link'));
  return contexts.join('/');
};

// checkProcedureContents: Checks contents of procedures and codeblocks for valid context
const checkProcedureContents = function (p: Procedure | CodeBlock, lintContext: LintContext) {
  let diagnostics: Diagnostic[] = [];
  // checks if current procedure/code block has at least one valid context
  if (noContext(p.Context)) {
    diagnostics.push({
      from: p.PositionStart,
      to: p.PositionEnd,
      severity: 'error',
      message: Localized.Get('Invalid context _.', p instanceof Procedure ? 'procedure' : 'code block'),
    });
  } else {
    // checks nested anonymous procedures and codeblocks for valid context
    for (let a of p.AnonymousProcedures) {
      diagnostics.push(...checkProcedureContents(a, lintContext));
    }
    for (let c of p.CodeBlocks) {
      diagnostics.push(...checkProcedureContents(c, lintContext));
      if (c.InheritParentContext && noContext(combineContexts(c.Context, p.Context))) {
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
