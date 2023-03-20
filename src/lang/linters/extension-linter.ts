import { syntaxTree } from '@codemirror/language';
import { Diagnostic } from '@codemirror/lint';
import { Localized } from '../../i18n/localized';
import { buildLinter } from './linter-builder';
import { PrimitiveManager } from '../primitives/primitives';

let primitives = PrimitiveManager;

//Checks if extension primitives are used without declaring the extension, or invalid extensions are declared
export const ExtensionLinter = buildLinter((view, parseState) => {
  const diagnostics: Diagnostic[] = [];
  let extension_index = 0;
  syntaxTree(view.state)
    .cursor()
    .iterate((noderef) => {
      if (noderef.name == 'Extensions') {
        noderef.node.getChildren('Identifier').map((child) => {
          let name = view.state.sliceDoc(child.from, child.to);
          if (primitives.GetExtensions().indexOf(name) == -1) {
            diagnostics.push({
              from: child.from,
              to: child.to,
              severity: 'error',
              message: Localized.Get('Incorrect extension _.', name),
            });
          }
        });
        noderef.node.getChildren('CloseBracket').map((child) => {
          extension_index = child.from;
        });
      } else if (
        (noderef.name.includes('Args') ||
          (noderef.name.includes('Unsupported') &&
            noderef.node.parent?.name != 'VariableName' &&
            noderef.node.parent?.name != 'NewVariableDeclaration' &&
            noderef.node.parent?.name != 'Arguments' &&
            noderef.node.parent?.name != 'AnonArguments')) &&
        !noderef.name.includes('Special')
      ) {
        const value = view.state
          .sliceDoc(noderef.from, noderef.to)
          .toLowerCase();
        let vals = value.split(':');
        if (vals.length > 1) {
          let found = false;
          for (let e of parseState.Extensions) {
            if (vals[0] == e) {
              found = true;
              break;
            }
          }
          if (!found) {
            diagnostics.push({
              from: noderef.from,
              to: noderef.to,
              severity: 'error',
              message: !noderef.name.includes('Unsupported')
                ? Localized.Get('Missing extension _.', vals[0])
                : Localized.Get('Unsupported missing extension _.', vals[0]),
              actions: [
                {
                  name: 'Add',
                  apply(view, from, to) {
                    view.dispatch({
                      changes: {
                        from: extension_index,
                        to: extension_index,
                        insert: vals[0] + ' ',
                      },
                    });
                  },
                },
              ],
            });
          }
        }
      }
    });
  return diagnostics;
});
