import { syntaxTree } from '@codemirror/language';
import { linter, Diagnostic } from '@codemirror/lint';
import { SyntaxNode } from '@lezer/common';
import { stateExtension } from '../codemirror/extension-state-netlogo';

const UnrecognizedGlobalLinter = linter((view) => {
  let diagnostics: Diagnostic[] = [];
  syntaxTree(view.state)
    .cursor()
    .iterate((node) => {
      if (node.name == 'Unrecognized')
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
    });
  return diagnostics;
});

var acceptableIdentifiers = [
  'Unrecognized',
  'NewVariableDeclaration',
  'ProcedureName',
  'Arguments',
  'Globals',
  'Breed',
  'BreedsOwn',
];

const checkValid = function (Node, value, state, breedNames) {
  let parents: SyntaxNode[] = [];
  let curr_node = Node;
  let procedureName = '';
  while (curr_node.parent) {
    parents.push(curr_node.parent);
    curr_node = curr_node.parent;
  }
  parents.map((node) => {
    if (node.name == 'Procedure') {
      node.getChildren('ProcedureName').map((child) => {
        procedureName = state.sliceDoc(child.from, child.to);
      });
    }
  }) 
  let procedureVars: string[] =[]
  let procedureNames: string[]=[]
  if (procedureName !=''){
    state.field(stateExtension)['Procedures'].map(procedure => {
      procedureNames.push(procedure.Name)
      if (procedure.Name==procedureName){
        let vars: string[]=[]
        procedure.Variables.map(variable => {
          if (variable.CreationPos < Node.from){
            vars.push(variable.Name)
          }
        });
        procedureVars = vars + procedure.Arguments;
      }
    });
  }

  return (
    acceptableIdentifiers.includes(Node.parent?.name) ||
    state.field(stateExtension)['Globals'].includes(value) ||
    breedNames.includes(value) ||
    procedureVars.includes(value) ||
    procedureNames.includes(value)
  )
}


const IdentifierLinter = linter(view => {
  let diagnostics: Diagnostic[] = []
  let breedNames: string[]= []
  view.state.field(stateExtension)['Breeds'].map(breed => {
    breedNames.push(breed.Singular)
    breedNames.push(breed.Plural)
    breedNames = breedNames.concat(breed.Variables)
  })
  syntaxTree(view.state).cursor().iterate(noderef => {
    if (noderef.name == "Identifier") {
      let Node = noderef.node
      let value = view.state.sliceDoc(noderef.from,noderef.to)
      if (!checkValid(Node,value,view.state,breedNames)){
        diagnostics.push({
          from: noderef.from,
          to: noderef.to,
          severity: "error",
          message: "Unrecognized identifier",
          actions: [{
            name: "Remove",
            apply(view, from, to) { 
              view.dispatch({changes: {from, to}}) 
            }
          }]
        })
      }
    }});
  return diagnostics;
});

const BreedLinter = linter( view => {
  let diagnostics: Diagnostic[] = []
  let breedNames: string[]= []
  view.state.field(stateExtension)['Breeds'].map(breed => {
    breedNames.push(breed.Singular)
    breedNames.push(breed.Plural)
  })
  syntaxTree(view.state).cursor().iterate(noderef => {
    if (noderef.name == "BreedProceduresReporters") {
      let Node = noderef.node
      let value = view.state.sliceDoc(noderef.from,noderef.to)
      if (!checkValidBreed(Node,value,view.state,breedNames)){
        diagnostics.push({
          from: noderef.from,
          to: noderef.to,
          severity: "error",
          message: "Unrecognized breed name",
          actions: [{
            name: "Remove",
            apply(view, from, to) { 
              view.dispatch({changes: {from, to}}) 
            }
          }]
        })
      }
    }});
  return diagnostics;
})

const checkValidBreed = function (Node, value, state, breedNames) {
  let isValid=false 
  Node.getChildren("BreedFirst").map(node => {
    let value = state.sliceDoc(node.from,node.to)
    value = value.split("-")
    value = value[0]
    if (breedNames.includes(value)){
      isValid = true
    }
  })
  Node.getChildren("BreedLast").map(node => {
    let value = state.sliceDoc(node.from,node.to)
    value = value.split("-")
    value = value[value.length-1]
    value = value.replace("?","")
    if (breedNames.includes(value)){
      isValid = true
    }
  })
  Node.getChildren("BreedMiddle").map(node => {
    let value = state.sliceDoc(node.from,node.to)
    value = value.split("-")
    value = value[1]
    if (breedNames.includes(value)){
      isValid = true
    }
  })
  return isValid
}

export { UnrecognizedGlobalLinter, IdentifierLinter ,BreedLinter};