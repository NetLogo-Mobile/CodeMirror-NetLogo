import { syntaxTree } from '@codemirror/language';
import { Diagnostic } from '@codemirror/lint';
import { Localized } from '../../i18n/localized';
import { buildLinter } from './linter-builder';

// UnrecognizedGlobalLinter: Checks if something at the top layer isn't a procedure, global, etc.
export const UnrecognizedGlobalLinter = buildLinter((view, parseState) => {
  const diagnostics: Diagnostic[] = [];
  syntaxTree(view.state)
    .cursor()
    .iterate((node) => {
      if (node.name == 'Unrecognized') {
        if (node.node.getChildren('Procedure').length > 0) {
          if (
            (node.node.parent?.getChildren('Globals').length ?? 0) > 0 ||
            (node.node.parent?.getChildren('Extensions').length ?? 0) > 0 ||
            (node.node.parent?.getChildren('Breed').length ?? 0) > 0 ||
            (node.node.parent?.getChildren('BreedsOwn').length ?? 0) > 0
          ) {
            let value = view.state.sliceDoc(node.from, node.to).split('\n')[0];
            let nameNode = node.node
              .getChild('Procedure')
              ?.getChild('ProcedureName');
            if (nameNode) {
              value = view.state.sliceDoc(nameNode.from, nameNode.to);
            }
            diagnostics.push({
              from: node.from,
              to: node.to,
              severity: 'error',
              message: Localized.Get('Improperly placed procedure _', value),
            });
          }
        } else {
          const value = view.state.sliceDoc(node.from, node.to);
          diagnostics.push({
            from: node.from,
            to: node.to,
            severity: 'error',
            message: Localized.Get('Unrecognized global statement _', value),
          });
        }
      }
    });
  return diagnostics;
});
