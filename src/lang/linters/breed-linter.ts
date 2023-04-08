import { syntaxTree } from '@codemirror/language';
import { Diagnostic } from '@codemirror/lint';
import { SyntaxNode } from '@lezer/common';
import { Localized } from '../../editor';
import { Linter } from './linter-builder';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Breed } from '../lang/classes.ts';
import {
  CheckContext,
  checkValidIdentifier,
  getCheckContext,
} from './utils/check-identifier';

// BreedLinter: To check breed commands/reporters for valid breed names
export const BreedLinter: Linter = (
  view,
  parseState,
  preprocessContext,
  lintContext
) => {
  const diagnostics: Diagnostic[] = [];
  const breeds = parseState.GetBreeds();
  const context = getCheckContext(view, lintContext, preprocessContext);
  syntaxTree(view.state)
    .cursor()
    .iterate((noderef) => {
      if (
        noderef.name == 'SpecialReporter1ArgsBoth' ||
        noderef.name == 'SpecialReporter0ArgsTurtle' ||
        noderef.name == 'SpecialReporter1ArgsTurtle' ||
        noderef.name == 'SpecialReporter2ArgsTurtle' ||
        noderef.name == 'SpecialReporter0ArgsLink' ||
        noderef.name == 'SpecialReporter0ArgsLinkP' ||
        noderef.name == 'SpecialReporter1ArgsLink' ||
        noderef.name == 'SpecialCommandCreateTurtle' ||
        noderef.name == 'SpecialCommandCreateLink' ||
        noderef.name == 'Own'
      ) {
        //console.log(lintContext)
        const Node = noderef.node;
        const value = view.state
          .sliceDoc(noderef.from, noderef.to)
          .toLowerCase();
        if (!checkValidBreed(Node, value, context, breeds)) {
          diagnostics.push({
            from: noderef.from,
            to: noderef.to,
            severity: 'error',
            message: Localized.Get('Unrecognized breed name _', value),
          });
        }
      }
    });
  return diagnostics;
};

// checkValidBreed: Checks if the term in the structure of a breed command/reporter
// is the name of an actual breed, and in the correct singular/plural form
const checkValidBreed = function (
  node: SyntaxNode,
  value: string,
  context: CheckContext,
  breeds: Breed[]
) {
  let isValid = true;
  //console.log(breeds)
  //collect possible breed names in the correct categories
  let pluralTurtle: string[] = [];
  let singularTurtle: string[] = [];
  let pluralLink: string[] = [];
  let singularLink: string[] = [];
  for (let b of breeds) {
    if (b.isLinkBreed) {
      pluralLink.push(b.Plural);
      singularLink.push(b.Singular);
    } else {
      pluralTurtle.push(b.Plural);
      singularTurtle.push(b.Singular);
    }
  }
  //check for correct breed name (depending on function type)
  if (node.name == 'SpecialCommandCreateLink') {
    isValid = listItemInString(value, singularLink.concat(pluralLink));
  } else if (
    node.name == 'SpecialReporter0ArgsLink' ||
    node.name == 'SpecialReporter1ArgsLink'
  ) {
    isValid = listItemInString(value, singularLink);
  } else if (node.name == 'SpecialReporter1ArgsBoth') {
    isValid = listItemInString(value, singularLink.concat(singularTurtle));
  } else if (node.name == 'Own') {
    isValid = listItemInString(value, pluralLink.concat(pluralTurtle));
  } else if (
    node.name == 'SpecialCommandCreateTurtle' ||
    node.name == 'SpecialReporter2ArgsTurtle' ||
    node.name == 'SpecialReporter1ArgsTurtle' ||
    node.name == 'SpecialReporter0ArgsTurtle'
  ) {
    isValid = listItemInString(value, pluralTurtle);
  } else if (node.name == 'SpecialReporter0ArgsLinkP') {
    isValid = listItemInString(value, pluralLink);
  }
  // some procedure names I've come across accidentally use the structure of a
  // breed command/reporter, e.g. ___-with, so this makes sure it's not a procedure name
  // before declaring it invalid
  if (!isValid && context.parseState.Procedures.get(value)) {
    isValid = true;
  }
  if (!isValid && node.name != 'Own') {
    // Why do we need this one?
    //We need it to check if it is actually a valid identifier, e.g. a variable name
    isValid = checkValidIdentifier(node, value, context);
  }
  return isValid;
};

//listItemInString: checks if any member of a list is in a string
const listItemInString = function (str: string, lst: string[]) {
  let found = false;
  for (let l of lst) {
    if (str.includes(l)) {
      found = true;
      break;
    }
  }
  return found;
};
