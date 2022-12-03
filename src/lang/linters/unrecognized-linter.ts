import { syntaxTree } from '@codemirror/language';
import { linter, Diagnostic } from '@codemirror/lint';
import { Localized } from '../../i18n/localized';

// checks if something at the top layer isn't a procedure, global, etc.
export const UnrecognizedLinter = linter((view) => {
  const diagnostics: Diagnostic[] = [];
  syntaxTree(view.state)
    .cursor()
    .iterate((node) => {
      if (node.name == '⚠' && node.to != node.from) {
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
    });
  return diagnostics;
});
