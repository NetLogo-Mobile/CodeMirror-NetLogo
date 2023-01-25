import { syntaxTree } from '@codemirror/language';
import { Diagnostic } from '@codemirror/lint';
import { SyntaxNode } from '@lezer/common';
import { EditorState } from '@codemirror/state';
import { StateNetLogo } from '../../codemirror/extension-state-netlogo';
import { Localized } from '../../i18n/localized';
import { buildLinter } from './linter-builder';

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
        if (
          !checkValid(
            Node,
            value,
            view.state,
            parseState,
            breedNames,
            breedVars
          )
        ) {
          let result = checkBreedLike(value);
          console.log(result);
          if (!result[0]) {
            diagnostics.push({
              from: noderef.from,
              to: noderef.to,
              severity: 'warning',
              message: Localized.Get('Unrecognized identifier _', value),
            });
          } else {
            let first = value.indexOf('-');
            let last = value.lastIndexOf('-');
            let str = '';
            if (result[1] == 'Last') {
              str = value.substring(first + 1);
            } else if (result[1] == 'First') {
              str = value.substring(0, last);
            } else if (result[1] == 'Middle') {
              str = value.substring(first + 1, last);
            } else {
              str = value.substring(first + 1, value.length - 1);
            }
            diagnostics.push({
              from: noderef.from,
              to: noderef.to,
              severity: 'warning',
              message: Localized.Get('Invalid breed procedure _', str),
            });
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
  'Globals',
  'BreedSingular',
  'BreedPlural',
  'BreedsOwn',
];

// Checks identifiers for valid variable/procedure/breed names
export const checkValid = function (
  Node: SyntaxNode,
  value: string,
  state: EditorState,
  parseState: StateNetLogo,
  breedNames: string[],
  breedVars: string[]
): boolean {
  value = value.toLowerCase();
  // checks if parent is in a category that is always valid (e.g. 'Globals')
  if (acceptableIdentifiers.includes(Node.parent?.name ?? '')) return true;
  // checks if identifier is a global variable
  if (
    parseState.Globals.includes(value) ||
    parseState.WidgetGlobals.includes(value) ||
    parseState.Procedures.has(value)
  )
    return true;
  // checks if identifier is a breed name or variable
  if (breedNames.includes(value) || breedVars.includes(value)) return true;
  // checks if identifier is a variable already declared in the procedure
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
    procedure?.AnonymousProcedures.map((anonProc) => {
      if (
        Node.from >= anonProc.PositionStart &&
        Node.to <= anonProc.PositionEnd
      ) {
        anonProc.Variables.map((variable) => variable.Name).forEach((name) =>
          procedureVars.push(name)
        );
        procedureVars.push(...anonProc.Arguments);
      }
    });
    if (procedure?.Arguments) {
      procedureVars.push(...procedure.Arguments);
    }
  }
  return procedureVars.includes(value);
};

const checkBreedLike = function (str: string) {
  let result = false;
  let location = '';
  if (str.match(/[^\s]+-(at)/)) {
    result = true;
    location = 'First';
  } else if (str.match(/[^\s]+-here/)) {
    result = true;
    location = 'First';
  } else if (str.match(/[^\s]+-neighbors/)) {
    result = true;
    location = 'First';
  } else if (str.match(/[^\s]+-on/)) {
    result = true;
    location = 'First';
  } else if (str.match(/[^\s]+-(with|neighbor\\?)/)) {
    result = true;
    location = 'First';
  } else if (str.match(/^(my|my-in|my-out)-[^\s]+/)) {
    result = true;
    location = 'Last';
  } else if (str.match(/^is-[^\s]+\\?$/)) {
    result = true;
    location = 'Question';
  } else if (str.match(/^in-[^\s]+-from$/)) {
    result = true;
    location = 'Middle';
  } else if (str.match(/^(in|out)-[^\s]+-(neighbors)$/)) {
    result = true;
    location = 'Middle';
  } else if (str.match(/^(in|out)-[^\s]+-(neighbor\\?)$/)) {
    result = true;
    location = 'Middle';
  } else if (str.match(/^out-[^\s]+-to$/)) {
    result = true;
    location = 'Middle';
  } else if (str.match(/^create-[^\s]+-(to|from|with)$/)) {
    result = true;
    location = 'Middle';
  } else if (str.match(/^(hatch|sprout|create|create-ordered)-[^\s]+/)) {
    result = true;
    location = 'Last';
  }
  return [result, location];
};
