import { syntaxTree } from '@codemirror/language';
import { linter, Diagnostic } from '@codemirror/lint';
import { SyntaxNode } from '@lezer/common';
import { EditorState } from '@codemirror/state';
import { stateExtension } from '../../codemirror/extension-state-netlogo';

// Checks anything labelled 'Identifier'
export const IdentifierLinter = linter((view) => {
  const diagnostics: Diagnostic[] = [];
  let breedNames: string[] = [];
  for (let breed of view.state.field(stateExtension).Breeds.values()) {
    breedNames.push(breed.Singular);
    breedNames.push(breed.Plural);
    breedNames = breedNames.concat(breed.Variables);
  }
  syntaxTree(view.state)
    .cursor()
    .iterate((noderef) => {
      if (noderef.name == 'Identifier') {
        const Node = noderef.node;
        const value = view.state.sliceDoc(noderef.from, noderef.to);
        if (!checkValid(Node, value, view.state, breedNames)) {
          diagnostics.push({
            from: noderef.from,
            to: noderef.to,
            severity: 'error',
            message: 'Unrecognized identifier',
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

// always acceptable identifiers (Unrecognized is always acceptable because previous linter already errors)
const acceptableIdentifiers = [
  'Unrecognized',
  'NewVariableDeclaration',
  'ProcedureName',
  'Arguments',
  'Globals',
  'Breed',
  'BreedsOwn',
];

// Checks identifiers for valid variable/procedure/breed names
export const checkValid = function (
  Node: SyntaxNode,
  value: string,
  state: EditorState,
  breedNames: string[]
) {
  value = value.toLowerCase();
  const parents: SyntaxNode[] = [];
  let curr_node = Node;
  let procedureName = '';
  while (curr_node.parent) {
    parents.push(curr_node.parent);
    curr_node = curr_node.parent;
  }
  // get procedure name--a bit convoluted but it works
  parents.map((node) => {
    if (node.name == 'Procedure') {
      node.getChildren('ProcedureName').map((child) => {
        procedureName = state.sliceDoc(child.from, child.to);
      });
    }
  });
  // gets list of procedure variables from own procedure, as well as list of all procedure names
  let procedureVars: string[] = [];
  const procedureNames = Array.from(
    state.field(stateExtension).Procedures.keys()
  );
  if (procedureName != '') {
    let procedure = state
      .field(stateExtension)
      .Procedures.get(procedureName.toLowerCase());
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

  return (
    // checks if parent is in a category that is always valid (e.g. 'Globals')
    acceptableIdentifiers.includes(Node.parent?.name ?? '') ||
    // checks if identifier is a global variable
    state.field(stateExtension).Globals.includes(value) ||
    // checks if identifier is a breed name or variable
    breedNames.includes(value) ||
    // checks if identifier is a variable already declared in the procedure
    procedureVars.includes(value) ||
    // checks if identifier is a procedure name
    procedureNames.includes(value)
  );
};
