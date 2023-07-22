import { syntaxTree } from '@codemirror/language';
import { Diagnostic } from '@codemirror/lint';
import { Localized } from '../../editor';
import { Linter } from './linter-builder';

// UnrecognizedGlobalLinter: Checks if something at the top layer isn't a procedure, global, etc.
export const UnrecognizedGlobalLinter: Linter = (view, preprocessContext, lintContext) => {
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
        let value: string;
        let nameNode = child.node.getChild('Procedure')?.getChild('ProcedureName');
        if (nameNode) {
          value = view.state.sliceDoc(nameNode.from, nameNode.to);
        } else {
          value = view.state.sliceDoc(child.from, child.to).split('\n')[0];
        }
        diagnostics.push({
          from: child.from,
          to: child.to,
          severity: 'error',
          message: Localized.Get('Improperly placed procedure _', value),
        });
      }
    });

    for (var key of ['Extensions', 'Globals']) {
      if (cursor.node.getChildren(key).length > 1) {
        let first = true;
        cursor.node.getChildren(key).map((child) => {
          if (first) {
            first = false;
          } else {
            diagnostics.push({
              from: child.from,
              to: child.to,
              severity: 'error',
              message: Localized.Get('Duplicate global statement _', key),
            });
          }
        });
      }
    }
  }
  return diagnostics;
};
