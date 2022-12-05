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
          diagnostics.push({
            from: noderef.from,
            to: noderef.to,
            severity: 'warning',
            message: Localized.Get('Unrecognized identifier _', value),
            /* actions: [
              {
                name: 'Remove',
                apply(view, from, to) {
                  view.dispatch({ changes: { from, to } });
                },
              },
            ], */
          });
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
    let vars: string[] = [];
    procedure?.Variables.map((variable) => {
      // makes sure the variable has already been created
      if (variable.CreationPos < Node.from) {
        vars.push(variable.Name);
      }
    });
    procedure?.AnonymousProcedures.map((anonProc) => {
      if (Node.from >= anonProc.From && Node.to <= anonProc.To) {
        anonProc.Variables.map((variable) => {
          vars.push(variable.Name);
        });
        vars = vars.concat(anonProc.Arguments);
      }
    });
    if (procedure?.Arguments) {
      procedureVars = vars.concat(procedure.Arguments);
    }
  }
  return procedureVars.includes(value);
};
