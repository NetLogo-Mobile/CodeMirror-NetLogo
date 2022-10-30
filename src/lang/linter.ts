import { syntaxTree } from '@codemirror/language';
import { linter, Diagnostic } from '@codemirror/lint';
import { SyntaxNode } from '@lezer/common';
import { stateExtension } from '../codemirror/extension-state-netlogo';

// checks if something at the top layer isn't a procedure, global, etc.
const UnrecognizedGlobalLinter = linter((view) => {
  const diagnostics: Diagnostic[] = [];
  syntaxTree(view.state)
    .cursor()
    .iterate((node) => {
      if (node.name == 'Unrecognized') {
        diagnostics.push({
          from: node.from,
          to: node.to,
          severity: 'error',
          message: 'Unrecognized global statement',
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
const checkValid = function (Node:SyntaxNode, value:string, state: EditorState, breedNames:string[]) {
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
  const procedureNames: string[] = [];
  if (procedureName != '') {
    state.field(stateExtension).Procedures.map((procedure) => {
      procedureNames.push(procedure.Name);
      if (procedure.Name == procedureName) {
        const vars: string[] = [];
        procedure.Variables.map((variable) => {
          // makes sure the variable has already been created
          if (variable.CreationPos < Node.from) {
            vars.push(variable.Name);
          }
        });
        procedureVars = vars + procedure.Arguments;
      }
    });
  }

  return (
    // checks if parent is in a category that is always valid (e.g. 'Globals')
    acceptableIdentifiers.includes(Node.parent?.name) ||
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

// Checks anything labelled 'Identifier'
const IdentifierLinter = linter((view) => {
  const diagnostics: Diagnostic[] = [];
  let breedNames: string[] = [];
  view.state.field(stateExtension).Breeds.map((breed) => {
    breedNames.push(breed.Singular);
    breedNames.push(breed.Plural);
    breedNames = breedNames.concat(breed.Variables);
  });
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

// Purpose is to check breed commands/reporters for valid breed names
const BreedLinter = linter((view) => {
  const diagnostics: Diagnostic[] = [];
  const breedNames: string[] = [];
  view.state.field(stateExtension).Breeds.map((breed) => {
    breedNames.push(breed.Singular);
    breedNames.push(breed.Plural);
  });
  syntaxTree(view.state)
    .cursor()
    .iterate((noderef) => {
      if (
        noderef.name == 'BreedFirst' ||
        noderef.name == 'BreedMiddle' ||
        noderef.name == 'BreedLast'
      ) {
        const Node = noderef.node;
        const value = view.state.sliceDoc(noderef.from, noderef.to);
        if (!checkValidBreed(Node, value, view.state, breedNames)) {
          diagnostics.push({
            from: noderef.from,
            to: noderef.to,
            severity: 'error',
            message: 'Unrecognized breed name',
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
const checkValidBreed = function (node, value, state, breedNames) {
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
  if (!isValid) {
    state.field(stateExtension).Procedures.map((procedure) => {
      if (value == procedure.Name) {
        isValid = true;
      }
    });
  }
  return isValid;
};

export { UnrecognizedGlobalLinter, IdentifierLinter, BreedLinter };
