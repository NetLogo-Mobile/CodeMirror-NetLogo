import { syntaxTree } from '@codemirror/language';
import { Diagnostic } from '@codemirror/lint';
import { Localized } from '../../i18n/localized';
import { buildLinter } from './linter-builder';

// ModeLinter: Checks if mode matches grammar
export const ModeLinter = buildLinter((view, parseState) => {
  const diagnostics: Diagnostic[] = [];
  syntaxTree(view.state)
    .cursor()
    .iterate((node) => {
      if (node.name == 'Program') {
        if (node.node.getChildren('OneLineMode').length > 0) {
          if (parseState.Mode != 'oneline') {
            let child = node.node.getChild('OneLineMode');
            let value = view.state.sliceDoc(child?.from, child?.to);
            diagnostics.push({
              from: node.from,
              to: node.to,
              severity: 'error',
              message: Localized.Get('Unrecognized global statement _', value),
            });
          }
        } else if (node.node.getChildren('EmbeddedMode').length > 0) {
          if (parseState.Mode != 'embedded') {
            let child = node.node.getChild('EmbeddedMode');
            let value = view.state.sliceDoc(child?.from, child?.to);
            diagnostics.push({
              from: node.from,
              to: node.to,
              severity: 'error',
              message: Localized.Get('Unrecognized global statement _', value),
            });
          }
        } else if (
          node.node.getChildren('Unrecognized').length > 0 ||
          node.node.getChildren('Procedure').length > 0 ||
          node.node.getChildren('Extensions').length > 0 ||
          node.node.getChildren('Globals').length > 0 ||
          node.node.getChildren('Breed').length > 0 ||
          node.node.getChildren('BreedsOwn').length > 0
        ) {
          if (parseState.Mode != 'normal') {
            for (let name of [
              'Unrecognized',
              'Procedure',
              'Extensions',
              'Globals',
              'Breed',
              'BreedsOwn',
            ]) {
              node.node.getChildren(name).map((child) => {
                let value = view.state.sliceDoc(child.from, child.to);
                diagnostics.push({
                  from: node.from,
                  to: node.to,
                  severity: 'error',
                  message: Localized.Get(
                    'Unrecognized global statement _',
                    value
                  ),
                });
              });
            }
          }
        }
      }
    });
  return diagnostics;
});
