import { syntaxTree } from '@codemirror/language';
import { Diagnostic } from '@codemirror/lint';
import { EditorView } from '@codemirror/view';
import { Linter, getDiagnostic } from './linter-builder';
import {
  checkValidIdentifier,
  getCheckContext,
  checkUndefinedBreed,
  checkUnrecognizedWithSuggestions,
} from '../utils/check-identifier';
import { getCodeName } from '../utils/code';
import { Localized } from 'src/editor';

// IdentifierLinter: Checks anything labelled 'Identifier'
export const IdentifierLinter: Linter = (view, preprocessContext, lintContext) => {
  const diagnostics: Diagnostic[] = [];
  const context = getCheckContext(view, lintContext, preprocessContext);
  syntaxTree(view.state)
    .cursor()
    .iterate((noderef) => {
      var parent = noderef.node.parent;
      if (
        (noderef.name == 'Identifier' && parent?.name != '⚠') ||
        (noderef.name == 'SpecialCommandCreateTurtlePossible' && parent?.name.includes('VariableName'))
      ) {
        const node = noderef.node;
        const value = getCodeName(view.state, node);
        // check if it meets some initial criteria for validity
        if (checkValidIdentifier(node, value, context)) return;
        // check if it's a negation
        if (value.startsWith('-') && checkValidIdentifier(node, value.slice(1), context)) {
          let d = getDiagnostic(view, noderef, 'Negation _');
          d.actions = [
            {
              name: Localized.Get('Fix'),
              apply(view: EditorView, from: number, to: number) {
                if (value.startsWith('(')) {
                  view.dispatch({ changes: { from, to, insert: '- ' + value.slice(1) } });
                } else {
                  view.dispatch({ changes: { from, to, insert: '(- ' + value.slice(1) + ')' } });
                }
              },
            },
          ];
          diagnostics.push(d);
          return;
        }
        // check if it is deprecated ?
        if (value === '?') {
          // if someone uses repeat 10 [ print ? ], the lint message becomes incorrect
          // it is better if we check the related primitive as well, but too complicated for now
          while (parent !== null) {
            if (parent.name === 'CodeBlock' || parent.name === 'Value') {
              diagnostics.push(getDiagnostic(view, noderef, 'Deprecated usage of ?'));
              return;
            }
            parent = parent.parent;
          }
        }
        // check if it is incorrect ,
        if (value === ',') {
          diagnostics.push(getDiagnostic(view, noderef, 'Incorrect usage of ,'));
          return;
        }
        // check if the identifier looks like a breed procedure (e.g. "create-___")
        if (checkUndefinedBreed(diagnostics, context.preprocessState, view, node)) return;
        // check if a suggestion exists
        if (checkUnrecognizedWithSuggestions(diagnostics, view, node)) return;
        // nothing more to check, so it is an unrecognized identifier
        diagnostics.push(getDiagnostic(view, noderef, 'Unrecognized identifier _'));
      } else if (noderef.name == 'SpecialCommandCreateTurtlePossible' && !parent?.name.includes('VariableName')) {
        checkUndefinedBreed(diagnostics, context.preprocessState, view, noderef.node);
      }
    });
  return diagnostics;
};
