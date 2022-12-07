import { syntaxTree } from '@codemirror/language';
import { Diagnostic } from '@codemirror/lint';
import { Localized } from '../../i18n/localized';
import { buildLinter } from './linter-builder';

// UnrecognizedLinter: Checks if something at the top layer isn't a procedure, global, etc.
export const UnsupportedLinter = buildLinter((view, parseState) => {
  const diagnostics: Diagnostic[] = [];
  syntaxTree(view.state)
    .cursor()
    .iterate((node) => {
      if (node.name == 'Unsupported') {
        // let curr = node.node
        // let parents: string []=[]
        // while (curr.parent){
        //   parents.push(curr.parent.name)
        //   curr = curr.parent
        // }
        // console.log(parents)
        const value = view.state.sliceDoc(node.from, node.to);
        diagnostics.push({
          from: node.from,
          to: node.to,
          severity: 'warning',
          message: Localized.Get('Unsupported statement _', value),
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
    });
  return diagnostics;
});
