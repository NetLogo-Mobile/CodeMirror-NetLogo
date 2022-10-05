import { parser } from "./lang.js"
import { foldNodeProp, foldInside, indentNodeProp, LRLanguage, LanguageSupport } from "@codemirror/language"
import { styleTags, tags as t } from "@lezer/highlight"
import { closeBrackets, completeFromList } from "@codemirror/autocomplete"
import { directives, commands, extensions, reporters, turtleVars, patchVars, linkVars, constants, unsupported } from "./keywords.js"

let parserWithMetadata = parser.configure({
  props: [
    styleTags({
      Constants: t.string,
      String: t.string,
      LineComment: t.lineComment,
      "[ ]": t.paren,
      Directives: t.strong,
      Numeric: t.string,
      Extensions: t.bool,
      LinkVars: t.bool,
      PatchVars: t.bool,
      TurtleVars: t.bool,
      Reporters: t.bool,
      Commands: t.variableName
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

let keywords = directives + commands + extensions + reporters + turtleVars + patchVars + linkVars + constants + unsupported
keywords = keywords.split(",")
let keywords_list = keywords.map(function (x) {
  return { label: x, type: "keyword" }
})

export const NetLogoCompletion = NetLogoLanguage.data.of({
  autocomplete: completeFromList(keywords_list)
})

export function NetLogo() {
  return new LanguageSupport(NetLogoLanguage, [NetLogoCompletion])
}

