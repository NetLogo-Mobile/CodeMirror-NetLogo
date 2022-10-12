import { parser } from "./lang.js"
import { foldNodeProp, foldInside, indentNodeProp, LRLanguage, LanguageSupport } from "@codemirror/language"
import { styleTags, tags as t } from "@lezer/highlight"
import { closeBrackets, completeFromList, ifNotIn } from "@codemirror/autocomplete"
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

let keywords = directives + commands + reporters + turtleVars + patchVars + linkVars + constants + unsupported
keywords = keywords.split(",")
let keywords_list = keywords.map(function (x) {
  return { label: x, type: "keyword" }
})

let extensions_map = extensions.map(function (x) {
  return { label: x, type: "keyword" }
})

// function completions(){
//   return ifNotIn('Extensions',keywords_list)
// }

export const NetLogoCompletion = NetLogoLanguage.data.of({
  autocomplete: ifIn(["Extensions"], completeFromList(extensions_map))
})

export function NetLogo() {
  return new LanguageSupport(NetLogoLanguage, [NetLogoCompletion])
}