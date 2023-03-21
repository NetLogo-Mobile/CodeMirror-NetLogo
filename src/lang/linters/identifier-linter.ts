import { syntaxTree } from '@codemirror/language';
import { Diagnostic } from '@codemirror/lint';
import { SyntaxNode } from '@lezer/common';
import { EditorState } from '@codemirror/state';
import { StateNetLogo } from '../../codemirror/extension-state-netlogo';
import { Localized } from '../../i18n/localized';
import { buildLinter } from './linter-builder';
import {
  AnonymousProcedure,
  Procedure,
  CodeBlock,
  BreedLocation,
} from '../classes';
import { preprocessStateExtension } from '../../codemirror/extension-state-preprocess';
import {
  checkBreedLike,
  getBreedName,
} from '../../codemirror/utils/breed_utils';

// IdentifierLinter: Checks anything labelled 'Identifier'
export const IdentifierLinter = buildLinter((view, parseState) => {
  const diagnostics: Diagnostic[] = [];
  const breedNames = parseState.GetBreedNames();
  const breedVars = parseState.GetBreedVariables();
  syntaxTree(view.state)
    .cursor()
    .iterate((noderef) => {
      if (noderef.name == 'Identifier') {
        const Node = noderef.node;
        const value = view.state.sliceDoc(noderef.from, noderef.to);
        //check if it meets some initial criteria for validity
        if (!checkValid(Node, value, view.state, parseState)) {
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
            if (!breedNames.includes(str)) {
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
});

// always acceptable identifiers (Unrecognized is always acceptable because previous linter already errors)
const acceptableIdentifiers = [
  'Unrecognized',
  'NewVariableDeclaration',
  'ProcedureName',
  'Arguments',
  'AnonArguments',
  'Globals',
  'BreedSingular',
  'BreedPlural',
  'BreedsOwn',
  'Extensions',
];

// Checks identifiers for valid variable/procedure/breed names
export const checkValid = function (
  Node: SyntaxNode,
  value: string,
  state: EditorState,
  parseState: StateNetLogo
): boolean {
  let breedNames = parseState.GetBreedNames();
  let breedVars = parseState.GetBreedVariables();
  let preprocess = state.field(preprocessStateExtension);
  value = value.toLowerCase();
  // checks if parent is in a category that is always valid (e.g. 'Globals')
  if (acceptableIdentifiers.includes(Node.parent?.name ?? '')) return true;
  // checks if identifier is a global variable
  if (
    parseState.Globals.includes(value) ||
    parseState.WidgetGlobals.includes(value) ||
    parseState.Procedures.has(value) ||
    preprocess.Commands[value] ||
    preprocess.Reporters[value]
  )
    return true;
  // checks if identifier is a breed name or variable
  if (breedNames.includes(value) || breedVars.includes(value)) return true;
  // checks if identifier is a variable already declared in the procedure
  // collects list of valid local variables for given position
  let procedureVars = getLocalVars(Node, state, parseState);
  //checks if the identifier is in the list of possible variables
  return procedureVars.includes(value);
};

// collects list of valid local variables for given position
export const getLocalVars = function (
  Node: SyntaxNode,
  state: EditorState,
  parseState: StateNetLogo
) {
  // get the procedure name
  let curr_node = Node;
  let procedureName = '';
  while (curr_node.parent) {
    curr_node = curr_node.parent;
    if (curr_node.name == 'Procedure') {
      curr_node.getChildren('ProcedureName').map((child) => {
        procedureName = state.sliceDoc(child.from, child.to);
      });
      break;
    }
  }
  // gets list of procedure variables from own procedure, as well as list of all procedure names
  let procedureVars: string[] = [];
  if (procedureName != '') {
    let procedure = parseState.Procedures.get(procedureName.toLowerCase());
    procedure?.Variables.map((variable) => {
      // makes sure the variable has already been created
      if (variable.CreationPos < Node.from) {
        procedureVars.push(variable.Name);
      }
    });
    //pulls out all local variables within the anonymous procedures up until current position
    if (procedure) {
      procedureVars.push(
        ...gatherAnonVars(procedure.AnonymousProcedures, Node)
      );
      procedureVars.push(...gatherAnonVars(procedure.CodeBlocks, Node));
    }
    if (procedure?.Arguments) {
      procedureVars.push(...procedure.Arguments);
    }
  }
  return procedureVars;
};

const gatherAnonVars = function (
  group: CodeBlock[] | Procedure[],
  Node: SyntaxNode
) {
  let procedureVars: string[] = [];
  group.map((anonProc) => {
    if (
      Node.from >= anonProc.PositionStart &&
      Node.to <= anonProc.PositionEnd
    ) {
      anonProc.Variables.map((variable) => {
        if (variable.CreationPos <= Node.from) {
          procedureVars.push(variable.Name);
        }
      });
      procedureVars.push(...anonProc.Arguments);
      procedureVars.push(...gatherAnonVars(anonProc.CodeBlocks, Node));
      procedureVars.push(...gatherAnonVars(anonProc.AnonymousProcedures, Node));
    }
  });
  return procedureVars;
};
