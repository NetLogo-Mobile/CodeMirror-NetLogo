import { syntaxTree } from '@codemirror/language';
import { Diagnostic } from '@codemirror/lint';
import { Localized } from '../../editor';
import { Linter } from './linter-builder';
import { unsupported } from '../keywords';
import {
  checkValidIdentifier,
  getCheckContext,
} from './utils/check-identifier';

// UnsupportedLinter: Checks for unsupported primitives
// Important note: anything with a colon and no supported extension is tokenized as
// 'UnsupportedPrim', so acceptable uses of variable names that include colons need
// to be filtered out here
export const UnsupportedLinter: Linter = (view, parseState) => {
  const diagnostics: Diagnostic[] = [];
  const context = getCheckContext(view);
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
        !checkValidIdentifier(node.node, value, context)
      ) {
        indices.push(node.from);
        diagnostics.push({
          from: node.from,
          to: node.to,
          severity: 'warning',
          message: Localized.Get('Unsupported statement _', value),
        });
      }
    });
  return diagnostics;
};
