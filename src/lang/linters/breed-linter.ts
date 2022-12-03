import { syntaxTree } from '@codemirror/language';
import { linter, Diagnostic } from '@codemirror/lint';
import { SyntaxNode } from '@lezer/common';
import { EditorState } from '@codemirror/state';
import { stateExtension } from '../../codemirror/extension-state-netlogo';
import { checkValid } from './identifier-linter';
import { Localized } from '../../i18n/localized';

// BreedLinter: To check breed commands/reporters for valid breed names
export const BreedLinter = linter((view) => {
  const diagnostics: Diagnostic[] = [];
  const breedNames: string[] = [];
  let breedVars: string[] = [];
  for (let breed of view.state.field(stateExtension).Breeds.values()) {
    breedNames.push(breed.Singular);
    breedNames.push(breed.Plural);
    breedVars = breedVars.concat(breed.Variables);
  }
  syntaxTree(view.state)
    .cursor()
    .iterate((noderef) => {
      if (
        noderef.name == 'BreedFirst' ||
        noderef.name == 'BreedMiddle' ||
        noderef.name == 'BreedLast'
      ) {
        const Node = noderef.node;
        const value = view.state
          .sliceDoc(noderef.from, noderef.to)
          .toLowerCase();
        if (!checkValidBreed(Node, value, view.state, breedNames, breedVars)) {
          diagnostics.push({
            from: noderef.from,
            to: noderef.to,
            severity: 'error',
            message: Localized.Get('Unrecognized breed name _', value),
            actions: [
              {
                name: 'Remove',
                apply(view, from, to) {
                  view.dispatch({ changes: { from, to } });
                },
              },
            ],
          });
        }
      }
    });
  return diagnostics;
});

// Checks if the term in the structure of a breed command/reporter is the name
// of an actual breed
const checkValidBreed = function (
  node: SyntaxNode,
  value: string,
  state: EditorState,
  breedNames: string[],
  breedVars: string[]
) {
  let isValid = false;
  const values = value.split('-');
  // These are broken up into BreedFirst, BreedMiddle, BreedLast so I know where to
  // check for the breed name. Entirely possible we don't need this and can just search
  // the whole string.
  if (node.name == 'BreedFirst') {
    const val = values[0];
    if (breedNames.includes(val)) {
      isValid = true;
    }
  } else if (node.name == 'BreedLast') {
    let val = values[values.length - 1];
    val = val.replace('?', '');
    if (breedNames.includes(val)) {
      isValid = true;
    }
  } else if (node.name == 'BreedMiddle') {
    const val = values[1];
    if (breedNames.includes(val)) {
      isValid = true;
    }
  }
  // some procedure names I've come across accidentally use the structure of a
  // breed command/reporter, e.g. ___-with, so this makes sure it's not a procedure name
  // before declaring it invalid
  if (state.field(stateExtension).Procedures.get(value)) {
    isValid = true;
  } else if (node.parent?.name == 'Own') {
    isValid = true;
  }
  if (!isValid) {
    isValid = checkValid(node, value, state, breedNames.concat(breedVars));
  }
  return isValid;
};
