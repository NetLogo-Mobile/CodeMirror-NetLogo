import { syntaxTree } from '@codemirror/language';
import { Diagnostic } from '@codemirror/lint';
import { Localized } from '../../editor';
import { Linter } from './linter-builder';
import { SyntaxNode } from '@lezer/common';

// UnrecognizedGlobalLinter: Checks if something at the top layer isn't a procedure, global, etc.
export const UnrecognizedGlobalLinter: Linter = (
  view,
  preprocessContext,
  lintContext
) => {
  const diagnostics: Diagnostic[] = [];
  let cursor = syntaxTree(view.state).cursor();
  let lastGlobalPos = 0;
  if (cursor.firstChild() && cursor.node.name == 'Normal') {
    for (var key of ['Extensions', 'Globals', 'BreedsOwn', 'Breed']) {
      cursor.node.getChildren(key).map((child) => {
        if (child.from > lastGlobalPos) {
          lastGlobalPos = child.from;
        }
      });
    }
    cursor.node.getChildren('Procedure').map((child) => {
      if (child.from < lastGlobalPos) {
        let value = view.state.sliceDoc(child.from, child.to).split('\n')[0];
        let nameNode = child.node
          .getChild('Procedure')
          ?.getChild('ProcedureName');
        if (nameNode) {
          value = view.state.sliceDoc(nameNode.from, nameNode.to);
        }
        diagnostics.push({
          from: child.from,
          to: child.to,
          severity: 'error',
          message: Localized.Get('Improperly placed procedure _', value),
        });
      }
    });
  }
  return diagnostics;
};
