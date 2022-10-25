import {syntaxTree} from "@codemirror/language"
import {linter, Diagnostic} from "@codemirror/lint"

const Linter = linter(view => {
  let diagnostics: Diagnostic[] = []
  let prev=""
  syntaxTree(view.state).cursor().iterate(node => {
    // if (prev=='Command' && node.name != "Numeric") diagnostics.push({
    //   from: node.from,
    //   to: node.to,
    //   severity: "warning",
    //   message: "Command must be followed by a number",
    //   actions: [{
    //     name: "Remove",
    //     apply(view, from, to) { view.dispatch({changes: {from, to}}) }
    //   }]
    // })
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
    prev=node.name
  })
  return diagnostics
})

export {Linter}