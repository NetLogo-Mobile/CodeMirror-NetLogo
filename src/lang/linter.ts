import {syntaxTree} from "@codemirror/language"
import {linter, Diagnostic} from "@codemirror/lint"
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
              console.log(variableName,vars)
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


export {UnrecognizedGlobalLinter, VariableLinter}