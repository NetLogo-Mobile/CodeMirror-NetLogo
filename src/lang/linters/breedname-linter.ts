import { syntaxTree } from '@codemirror/language';
import { Diagnostic } from '@codemirror/lint';
import { Localized } from '../../editor';
import { buildLinter } from './linter-builder';

// BreedNameLinter: Ensures no duplicate breed names
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
