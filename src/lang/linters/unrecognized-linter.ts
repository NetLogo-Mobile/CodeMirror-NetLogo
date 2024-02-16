import { syntaxTree } from '@codemirror/language';
import { Diagnostic } from '@codemirror/lint';
import { Log } from '../../utils/debug-utils';
import { Linter, getDiagnostic } from './linter-builder';
import { reserved } from '../keywords';
import { checkUndefinedBreed, getCheckContext, checkUnrecognizedWithSuggestions } from '../utils/check-identifier';
import { getCodeName } from '../utils/code';
import { stateExtension } from 'src/codemirror/extension-state-netlogo';
import { ParseMode } from 'src/editor-config';

// UnrecognizedLinter: Checks for anything that can't be parsed by the grammar
export const UnrecognizedLinter: Linter = (view, preprocessContext, lintContext) => {
  const diagnostics: Diagnostic[] = [];
  const context = getCheckContext(view, lintContext, preprocessContext);
  syntaxTree(view.state)
    .cursor()
    .iterate((node) => {
      if (
        (node.name == '⚠' || node.name == 'Error' || node.name == 'Misplaced' || node.name == 'WorseParentheticals') &&
        node.to != node.from
      ) {
        let curr = node.node;
        let parents: string[] = [];
        while (curr.parent) {
          parents.push(curr.parent.name);
          curr = curr.parent;
        }
        const value = getCodeName(view.state, node);
        Log(value, node.name, parents);
        if (node.name == 'Misplaced') {
          let sum: number = 0;
          let types: string[] = ['Extensions', 'Globals', 'Breed', 'BreedsOwn', 'Procedure'];
          types.map((name: string) => {
            sum += node.node.parent?.getChildren(name).length ?? 0;
          });
          if (sum == 0 && view.state.field(stateExtension).Mode != ParseMode.Normal) {
            return;
          }
        }
        if (node.node.parent?.name == 'Arguments') {
          // Arguments should not be reserved words or command/reporter names
          let child = node.node.firstChild;
          if (
            reserved.includes(value) ||
            (child && (child.name.startsWith('Command') || child.name.startsWith('Reporter')))
          ) {
            diagnostics.push(getDiagnostic(view, node, 'Argument is reserved _'));
          } else {
            diagnostics.push(getDiagnostic(view, node, 'Argument is invalid _'));
          }
        } else if (node.node.parent?.name == 'SetVariable') {
          if (node.node.prevSibling?.name == 'Set') {
            diagnostics.push(getDiagnostic(view, node.node, 'Term _ reserved', 'error', value, 'Local variable'));
          } else {
            diagnostics.push(getDiagnostic(view, node, 'Unrecognized statement _'));
          }
        } else if (
          !['[', ']', ')', '(', '"'].includes(value) &&
          !checkUndefinedBreed(diagnostics, context.preprocessState, view, node.node)
        ) {
          // Check if a suggestion exists
          if (checkUnrecognizedWithSuggestions(diagnostics, view, node)) return;
          // Anything else could be an unrecognized statement
          if (node.node.parent?.name == 'Normal') {
            diagnostics.push(getDiagnostic(view, node, 'Unrecognized global statement _'));
          } else {
            // console.log("HERE!!!!")
            if (
              node.node.firstChild?.node.name == 'Identifier' &&
              node.node.lastChild?.node.name == 'Identifier' &&
              node.node.getChildren('Identifier').length == 1
            ) {
              // console.log("1")
              diagnostics.push(getDiagnostic(view, node, 'Unrecognized identifier _'));
            } else {
              // console.log(node.node.getChildren('Identifier').length,node.node.lastChild,node.node.firstChild)
              diagnostics.push(getDiagnostic(view, node, 'Unrecognized statement _'));
            }
          }
        } else if (['[', ']', ')', '(', '"'].includes(value) && node.node.parent?.name == 'Breed') {
          diagnostics.push(getDiagnostic(view, node.node.parent, 'Missing breed names _'));
        }
      }
    });
  return diagnostics;
};
