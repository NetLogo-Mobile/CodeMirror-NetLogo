import { parser } from "./lang.js"
import { foldNodeProp, foldInside, indentNodeProp, LRLanguage, LanguageSupport, syntaxTree } from "@codemirror/language"
import { styleTags, tags as t } from "@lezer/highlight"
import {SyntaxNode} from "@lezer/common"
import { closeBrackets, completeFromList, CompletionSource, CompletionContext, CompletionResult  } from "@codemirror/autocomplete"
import { directives, commands, extensions, reporters, turtleVars, patchVars, linkVars, constants, unsupported } from "./keywords.js"

let parserWithMetadata = parser.configure({
  props: [
    styleTags({
      Constant: t.string,
      String: t.string,
      LineComment: t.lineComment,
      "[ ]": t.paren,
      Directive: t.strong,
      Numeric: t.string,
      Extension: t.bool,
      LinkVar: t.bool,
      PatchVar: t.bool,
      TurtleVar: t.bool,
      Reporter: t.bool,
      Command: t.variableName,
      Extensions: t.string,
      Globals: t.string,
      Breed: t.string,
      BreedsOwn: t.string,
    }),
    indentNodeProp.add({
      Application: context => context.column(context.node.from) + context.unit
    }),
    foldNodeProp.add({
      Application: foldInside
    })
  ]
})

export const NetLogoLanguage = LRLanguage.define({
  parser: parserWithMetadata,
  languageData: {
    commentTokens: { line: ";" },
    closeBrackets: closeBrackets()
  }
})

let keywords = [...directives , ...commands , ...reporters , ...turtleVars , ...patchVars , ...linkVars , ...constants , ...unsupported]
let keywords_list = keywords.map(function (x) {
  return { label: x, type: "keyword" }
})

let extensions_map = extensions.map(function (x) {
  return { label: x, type: "keyword" }
})

function completions(): CompletionSource{
    return (context: CompletionContext) => {
        let node = syntaxTree(context.state).resolveInner(context.pos,-1)
        let from = /\./.test(node.name) ? node.to : node.from
        if ((node.parent !=null && node.parent.type.name=='Extensions' )||(node.parent !=null && node.parent.parent !=null && node.parent.parent.type.name=='Extensions' ) ){ 
          return {
              from,
              options:extensions_map
          }
        }
        else if (node && node.type.name=='Identifier'){
          return {
            from,
            options:keywords_list
          }
        }
        // if tag==''
        return null
      }
}

// function completeFromGlobalScope(context: CompletionContext) {
//   let nodeBefore = syntaxTree(context.state).resolveInner(context.pos, -1)

//   if (completePropertyAfter.includes(nodeBefore.name) &&
//       nodeBefore.parent?.name == "MemberExpression") {
//     let object = nodeBefore.parent.getChild("Expression")
//     if (object?.name == "VariableName") {
//       let from = /\./.test(nodeBefore.name) ? nodeBefore.to : nodeBefore.from
//       let variableName = context.state.sliceDoc(object.from, object.to)
//       if (typeof window[variableName] == "object")
//         return completeProperties(from, window[variableName])
//     }
//   } else if (nodeBefore.name == "VariableName") {
//     return completeProperties(nodeBefore.from, window)
//   } else if (context.explicit && !dontCompleteIn.includes(nodeBefore.name)) {
//     return completeProperties(context.pos, window)
//   }
//   return null
// }

export const NetLogoCompletion = NetLogoLanguage.data.of({
  autocomplete: completions() //completeFromList(keywords_list)
})

export function NetLogo() {
  return new LanguageSupport(NetLogoLanguage, [NetLogoCompletion])
}