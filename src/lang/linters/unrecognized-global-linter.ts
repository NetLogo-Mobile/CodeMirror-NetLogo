import { syntaxTree } from '@codemirror/language';
import { linter, Diagnostic } from '@codemirror/lint';
import { Localized } from '../../i18n/localized';

// checks if something at the top layer isn't a procedure, global, etc.
export const UnrecognizedGlobalLinter = linter((view) => {
  const diagnostics: Diagnostic[] = [];
  syntaxTree(view.state)
    .cursor()
    .iterate((node) => {
      if (node.name == 'Unrecognized') {
        const value = view.state.sliceDoc(node.from, node.to);
        diagnostics.push({
          from: node.from,
          to: node.to,
          severity: 'error',
          message: Localized.Get('Unrecognized global statement _', value),
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
