import {syntaxTree} from "@codemirror/language"
import {linter, Diagnostic} from "@codemirror/lint"
import { SyntaxNode } from "@lezer/common"
import nodeTest from "node:test"
import { stateExtension } from "../codemirror/extension-state-netlogo"

const UnrecognizedGlobalLinter = linter(view => {
  let diagnostics: Diagnostic[] = []
  syntaxTree(view.state).cursor().iterate(node => {
    if (node.name == "Unrecognized") diagnostics.push({
      from: node.from,
      to: node.to,
      severity: "error",
      message: "Unrecognized global statement",
      actions: [{
        name: "Remove",
        apply(view, from, to) { view.dispatch({changes: {from, to}}) }
      }]
    })
  })
  return diagnostics
})

var acceptableIdentifiers= [
  'Unrecognized',
  'NewVariableDeclaration',
  'ProcedureName',
  'Arguments',
  'Globals',
  'Breed',
  'BreedsOwn'
]

const checkValid = function(Node,value,state,breedNames){
  let parents: SyntaxNode[]=[]
  let curr_node=Node
  let procedureName=""
  while (curr_node.parent){
    parents.push(curr_node.parent)
    curr_node = curr_node.parent
  }
  parents.map(node => {
    if (node.name=='Procedure'){
      node.getChildren("ProcedureName").map(child => {
        procedureName=state.sliceDoc(child.from,child.to)
      })

    }
  }) 
  let procedureVars: string[] =[]
  if (procedureName !=''){
    state.field(stateExtension)['Procedures'].map(procedure => {
      if (procedure.Name==procedureName){
        procedureVars = procedure.Variables + procedure.Arguments
        console.log(procedureVars)
      }
    })
  }
  
  return acceptableIdentifiers.includes(Node.parent?.name) ||
    state.field(stateExtension)['Globals'].includes(value) ||
    breedNames.includes(value) ||
    procedureVars.includes(value)
}


const IdentifierLinter = linter(view => {
  let diagnostics: Diagnostic[] = []
  let breedNames: string[]= []
  view.state.field(stateExtension)['Breeds'].map(breed => {
    breedNames.push(breed.Singular)
    breedNames.push(breed.Plural)
    breedNames.concat(breed.Variables)
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
            apply(view, from, to) { view.dispatch({changes: {from, to}}) }
          }]
        })
      }
    }
  })
  return diagnostics
})


const VariableLinter = linter(view => {
  let diagnostics: Diagnostic[] = []
  var Cursor = syntaxTree(view.state).cursor()
  let procedures = view.state.field(stateExtension)['Procedures']
  Cursor.node.getChildren("Procedure").map(node1 => {
    let vars=['']
    node1.getChildren("ProcedureName").map(Node =>{
      let procedureName = view.state.sliceDoc(Node.from,Node.to)
      for (let p of procedures){
        if (p['Name']==procedureName){
          vars = p['Variables']
        }
      } 
    })  
    node1.getChildren("ProcedureContent").map(node2 => {
      node2.getChildren("VariableDeclaration").map(node3 => {
        node3.getChildren("SetVariable").map(node4 => {
          node4.getChildren("VariableName").map(node5 => {
            node5.getChildren("Identifier").map(node6 => {
              let variableName = view.state.sliceDoc(node6.from,node6.to)
              if (!view.state.field(stateExtension)['Globals'].includes(variableName) && !vars.includes(variableName)){
                diagnostics.push({
                  from: node6.from,
                  to: node6.to,
                  severity: "error",
                  message: "Undeclared Variable",
                  actions: [{
                    name: "Remove",
                    apply(view, from, to) { view.dispatch({changes: {from, to}}) }
                  }]
                })
              }
            })
          })
        })
      })
    })
  });  
  return diagnostics
})


export {UnrecognizedGlobalLinter, IdentifierLinter}