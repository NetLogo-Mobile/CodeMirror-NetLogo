import { parser } from "./lang.js"
import { foldNodeProp, foldInside, indentNodeProp } from "@codemirror/language"
import { styleTags, tags as t } from "@lezer/highlight"
import { closeBrackets, completeFromList } from "@codemirror/autocomplete"

let parserWithMetadata = parser.configure({
  props: [
    styleTags({
      Identifier: t.variableName,
      Constant: t.string,
      String: t.string,
      LineComment: t.lineComment,
      "[ ]": t.paren,
      Directive: t.strong,
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

import { LRLanguage } from "@codemirror/language"

export const exampleLanguage = LRLanguage.define({
  parser: parserWithMetadata,
  languageData: {
    commentTokens: { line: ";" },
    closeBrackets: closeBrackets()
  }
})


export const exampleCompletion = exampleLanguage.data.of({
  autocomplete: completeFromList([
    { label: "defun", type: "keyword" },
    { label: "defvar", type: "keyword" },
    { label: "let", type: "keyword" },
    { label: "cons", type: "function" },
    { label: "car", type: "function" },
    { label: "cdr", type: "function" }
  ])
})

import { LanguageSupport } from "@codemirror/language"

export function example() {
  return new LanguageSupport(exampleLanguage, [exampleCompletion])
}

