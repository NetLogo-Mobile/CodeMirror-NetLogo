import { syntaxTree } from '@codemirror/language';
import { Diagnostic } from '@codemirror/lint';
import { Localized } from '../../editor';
import { Linter } from './linter-builder';
import {
  checkBreedLike,
  getBreedName,
} from '../../codemirror/utils/breed_utils';
import { checkValidIdentifier, getCheckContext } from './utils/check-identifier';

// IdentifierLinter: Checks anything labelled 'Identifier'
export const IdentifierLinter: Linter = (view, parseState) => {
  const diagnostics: Diagnostic[] = [];
  const context = getCheckContext(view);
  syntaxTree(view.state)
    .cursor()
    .iterate((noderef) => {
      if (noderef.name == 'Identifier') {
        const Node = noderef.node;
        const value = view.state.sliceDoc(noderef.from, noderef.to);
        //check if it meets some initial criteria for validity
        if (!checkValidIdentifier(Node, value, context)) {
          //check if the identifier looks like a breed procedure (e.g. "create-___")
          let result = checkBreedLike(value);
          if (!result[0]) {
            console.log(noderef.name, noderef.node.parent?.name);
            diagnostics.push({
              from: noderef.from,
              to: noderef.to,
              severity: 'error',
              message: Localized.Get('Unrecognized identifier _', value),
            });
          } else {
            //pull out name of possible intended breed
            let str = getBreedName(value);
            if (!context.breedNames.includes(str)) {
              diagnostics.push({
                from: noderef.from,
                to: noderef.to,
                severity: 'error',
                message: Localized.Get('Invalid breed procedure _', str),
              });
            }
          }
        }
      }
    });
  return diagnostics;
};