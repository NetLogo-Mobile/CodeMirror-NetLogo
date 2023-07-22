import { syntaxTree } from '@codemirror/language';
import { Diagnostic } from '@codemirror/lint';
import { Localized } from '../../editor';
import { Linter } from './linter-builder';
import { unsupported } from '../keywords';
import { checkValidIdentifier, getCheckContext } from '../utils/check-identifier';
import { getCodeName } from '../utils/code';

// UnsupportedLinter: Checks for unsupported primitives
// Important note: anything with a colon and no supported extension is tokenized as
// 'UnsupportedPrim', so acceptable uses of variable names that include colons need
// to be filtered out here
export const UnsupportedLinter: Linter = (view, preprocessContext, lintContext) => {
  const diagnostics: Diagnostic[] = [];
  const context = getCheckContext(view, lintContext, preprocessContext);
  let indices: number[] = [];
  syntaxTree(view.state)
    .cursor()
    .iterate((node) => {
      if (indices.includes(node.from)) return;
      const value = getCodeName(view.state, node);
      // Unsupported primitives are always linted - they are reserved anyway
      if (unsupported.includes(value)) {
        indices.push(node.from);
        diagnostics.push({
          from: node.from,
          to: node.to,
          severity: 'warning',
          message: Localized.Get('Unsupported statement _', value),
        });
      }
      // Otherwise, there could be a extension-like identifier that we need to rule out
      if (
        node.name.includes('Unsupported') &&
        node.node.parent?.name != 'VariableName' &&
        node.node.parent?.name != 'NewVariableDeclaration' &&
        node.node.parent?.name != 'Arguments' &&
        node.node.parent?.name != 'AnonArguments' &&
        node.node.parent?.name != 'ProcedureName' &&
        !checkValidIdentifier(node.node, value, context)
      ) {
        indices.push(node.from);
        diagnostics.push({
          from: node.from,
          to: node.to,
          severity: 'warning',
          message: Localized.Get('Unsupported extension statement _', value),
        });
      }
    });
  return diagnostics;
};
