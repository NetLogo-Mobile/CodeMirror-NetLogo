import { syntaxTree } from '@codemirror/language';
import { linter, Diagnostic } from '@codemirror/lint';
import { SyntaxNode } from '@lezer/common';
import { EditorState } from '@codemirror/state';
import { preprocessStateExtension } from '../../codemirror/extension-regex-state';
import { PrimitiveManager } from '../primitives/primitives';
import { NetLogoType } from '../classes';
import { Localized } from '../../i18n/localized';
import { buildLinter } from './linter-builder';

// Checks anything labelled 'Identifier'
export const BreedNameLinter = buildLinter((view, parseState) => {
  const diagnostics: Diagnostic[] = [];
  let seen: string[] = [];
  syntaxTree(view.state)
    .cursor()
    .iterate((noderef) => {
      if (noderef.name == 'BreedSingular' || noderef.name == 'BreedPlural') {
        const value = view.state
          .sliceDoc(noderef.from, noderef.to)
          .toLowerCase();
        if (seen.includes(value)) {
          diagnostics.push({
            from: noderef.from,
            to: noderef.to,
            severity: 'error',
            message: Localized.Get('Breed name _ already used.', value),
          });
        }
        seen.push(value);
      }
    });
  return diagnostics;
});
