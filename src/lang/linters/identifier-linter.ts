import { syntaxTree } from '@codemirror/language';
import { Diagnostic } from '@codemirror/lint';
import { EditorView } from '@codemirror/view';
import { Linter, getDiagnostic } from './linter-builder';
import { checkBreedLike } from '../../utils/breed-utils';
import { checkValidIdentifier, getCheckContext, checkBreed } from '../utils/check-identifier';
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
      if (noderef.name == 'Identifier' && parent?.name != '⚠') {
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
                view.dispatch({ changes: { from, to, insert: '(- ' + value.slice(1) + ' )' } });
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
        // check if the identifier looks like a breed procedure (e.g. "create-___")
        let result = checkBreedLike(value);
        if (!result.found) {
          if (UnrecognizedSuggestions.hasOwnProperty(value)) {
            diagnostics.push(
              getDiagnostic(
                view,
                noderef,
                'Unrecognized identifier with replacement _',
                'error',
                value,
                UnrecognizedSuggestions[value]
              )
            );
          } else {
            diagnostics.push(getDiagnostic(view, noderef, 'Unrecognized identifier _'));
          }
        } else {
          checkBreed(diagnostics, context, view, node);
        }
      }
    });
  return diagnostics;
};

/** UnrecognizedSuggestions: Suggestions for unrecognized identifiers. */
export const UnrecognizedSuggestions: Record<string, string> = {
  else: 'if-else',
  'set-patch-color': 'set pcolor',
};
