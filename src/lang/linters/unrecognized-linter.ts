import { syntaxTree } from '@codemirror/language';
import { Diagnostic } from '@codemirror/lint';
import { Localized } from '../../editor';
import { buildLinter } from './linter-builder';

// UnrecognizedLinter: Checks for anything that can't be parsed by the grammar
export const UnrecognizedLinter = buildLinter((view, parseState) => {
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
          });
        }
      }
    });
  return diagnostics;
});
