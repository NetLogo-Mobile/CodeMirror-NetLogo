import { syntaxTree } from '@codemirror/language';
import { Diagnostic } from '@codemirror/lint';
import { Localized } from '../../i18n/localized';
import { buildLinter } from './linter-builder';
import { unsupported } from '../keywords';
import { checkValid } from './identifier-linter';

// UnsupportedLinter: Checks for unsupported primitives
export const UnsupportedLinter = buildLinter((view, parseState) => {
  const diagnostics: Diagnostic[] = [];
  let indices: number[] = [];
  syntaxTree(view.state)
    .cursor()
    .iterate((node) => {
      const value = view.state.sliceDoc(node.from, node.to);
      if (
        ((node.name.includes('Unsupported') &&
          node.node.parent?.name != 'VariableName' &&
          node.node.parent?.name != 'NewVariableDeclaration' &&
          node.node.parent?.name != 'Arguments' &&
          node.node.parent?.name != 'AnonArguments' &&
          node.node.parent?.name != 'ProcedureName') ||
          unsupported.includes(value)) &&
        !indices.includes(node.from) &&
        !checkValid(
          node.node,
          value,
          view.state,
          parseState,
          parseState.GetBreedNames(),
          parseState.GetBreedVariables()
        )
      ) {
        indices.push(node.from);
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
