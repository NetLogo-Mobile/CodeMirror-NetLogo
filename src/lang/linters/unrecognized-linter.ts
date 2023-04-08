import { syntaxTree } from '@codemirror/language';
import { Diagnostic } from '@codemirror/lint';
import { Localized } from '../../i18n/localized';
import { buildLinter } from './linter-builder';
import { Linter } from './linter-builder';

// UnrecognizedLinter: Checks for anything that can't be parsed by the grammar
export const UnrecognizedLinter: Linter = (view, parseState,preprocessContext,lintContext) => {
  const diagnostics: Diagnostic[] = [];
  syntaxTree(view.state)
    .cursor()
    .iterate((node) => {
      if (node.name == '⚠' && node.to != node.from) {
        let curr = node.node;
        let parents: string[] = [];
        while (curr.parent) {
          parents.push(curr.parent.name);
          curr = curr.parent;
        }

        const value = view.state.sliceDoc(node.from, node.to);
        console.log(value, node.name, parents);
        if (!['[', ']', ')', '(', '"'].includes(value)) {
          diagnostics.push({
            from: node.from,
            to: node.to,
            severity: 'error',
            message: Localized.Get('Unrecognized statement _', value),
            /* actions: [
              {
                name: 'Remove',
                apply(view, from, to) {
                  view.dispatch({ changes: { from, to } });
                },
              },
            ], */
          });
        }
      }
    });
  return diagnostics;
};
