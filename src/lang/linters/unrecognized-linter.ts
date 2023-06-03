import { syntaxTree } from '@codemirror/language';
import { Diagnostic } from '@codemirror/lint';
import { Log } from '../../codemirror/utils/debug-utils';
import { Linter, getDiagnostic } from './linter-builder';
import { checkBreedLike } from '../../codemirror/utils/breed-utils';
import { reserved } from '../keywords';

// UnrecognizedLinter: Checks for anything that can't be parsed by the grammar
export const UnrecognizedLinter: Linter = (view, preprocessContext, lintContext) => {
  const diagnostics: Diagnostic[] = [];
  syntaxTree(view.state)
    .cursor()
    .iterate((node) => {
      if ((node.name == '⚠' || node.name == 'Error' || node.name == 'Misplaced') && node.to != node.from) {
        let curr = node.node;
        let parents: string[] = [];
        while (curr.parent) {
          parents.push(curr.parent.name);
          curr = curr.parent;
        }

        const value = view.state.sliceDoc(node.from, node.to);
        Log(value, node.name, parents);
        if (node.node.parent?.name == 'Arguments') {
          let child = node.node.firstChild;
          if (
            reserved.includes(value) ||
            (child && (child.name.startsWith('Command') || child.name.startsWith('Reporter')))
          ) {
            diagnostics.push(getDiagnostic(view, node, 'Argument is reserved _'));
          } else {
            diagnostics.push(getDiagnostic(view, node, 'Argument is invalid _'));
          }
        } else if (!['[', ']', ')', '(', '"'].includes(value) && !checkBreedLike(value).found) {
          if (node.node.parent?.name == 'Normal') {
            diagnostics.push(getDiagnostic(view, node, 'Unrecognized global statement _'));
          } else {
            diagnostics.push(getDiagnostic(view, node, 'Unrecognized statement _'));
          }
        }
      }
    });
  return diagnostics;
};
