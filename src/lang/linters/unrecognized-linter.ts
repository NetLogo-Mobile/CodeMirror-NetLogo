import { syntaxTree } from '@codemirror/language';
import { Diagnostic } from '@codemirror/lint';
import { Log } from '../../codemirror/utils/debug-utils';
import { Linter, getDiagnostic } from './linter-builder';
import { checkBreedLike } from '../../codemirror/utils/breed-utils';

// UnrecognizedLinter: Checks for anything that can't be parsed by the grammar
export const UnrecognizedLinter: Linter = (
  view,
  preprocessContext,
  lintContext
) => {
  const diagnostics: Diagnostic[] = [];
  syntaxTree(view.state)
    .cursor()
    .iterate((node) => {
      if ((node.name == '⚠' || node.name == 'Error') && node.to != node.from) {
        let curr = node.node;
        let parents: string[] = [];
        while (curr.parent) {
          parents.push(curr.parent.name);
          curr = curr.parent;
        }

        const value = view.state.sliceDoc(node.from, node.to);
        Log(value, node.name, parents);
        if (
          !['[', ']', ')', '(', '"'].includes(value) &&
          !checkBreedLike(value).found
        ) {
          if (node.node.parent?.name == 'Normal') {
            diagnostics.push(
              getDiagnostic(view, node, 'Unrecognized global statement _')
            );
          } else {
            diagnostics.push(
              getDiagnostic(view, node, 'Unrecognized statement _')
            );
          }
        }
      }
    });
  return diagnostics;
};
