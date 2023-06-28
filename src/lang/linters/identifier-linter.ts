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
      if (noderef.name == 'Identifier' && noderef.node.parent?.name != '⚠') {
        const node = noderef.node;
        const value = getCodeName(view.state, node);
        // check if it meets some initial criteria for validity
        if (checkValidIdentifier(node, value, context)) return;
        if (value.startsWith('-') && checkValidIdentifier(node, value.slice(1), context)) {
          let d = getDiagnostic(view, noderef, 'Negation _');
          d.actions = [
            {
              name: Localized.Get('Fix'),
              apply(view: EditorView, from: number, to: number) {
                view.dispatch({ changes: { from, to, insert: '( - ' + value.slice(1) + ' )' } });
              },
            },
          ];
          diagnostics.push(d);
          return;
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
