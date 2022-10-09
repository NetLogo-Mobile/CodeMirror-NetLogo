import { parser } from "./lang.js"
import { foldNodeProp, foldInside, indentNodeProp, LanguageSupport, LRLanguage } from "@codemirror/language"
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
      Directive: t.strong,
      Numeric: t.string,
      Extension: t.bool,
      LinkVar: t.bool,
      PatchVar: t.bool,
      TurtleVar: t.bool,
      Reporter: t.bool,
      Command: t.variableName
    }),
    indentNodeProp.add({
      Application: context => context.column(context.node.from) + context.unit
    }),
    foldNodeProp.add({
      Application: foldInside
    })
  ]
});

export const exampleLanguage = LRLanguage.define({
  parser: parserWithMetadata,
  languageData: {
    commentTokens: { line: ";" },
    closeBrackets: closeBrackets()
  }
});

let keywords = directives + commands + extensions + reporters + turtleVars + patchVars + linkVars + constants;
keywords = keywords.split(",");
let keywords_list = keywords.map(function (x) {
  return { label: x, type: "keyword" };
});

export const exampleCompletion = exampleLanguage.data.of({
  autocomplete: completeFromList(keywords_list)
});

export function example() {
  return new LanguageSupport(exampleLanguage, [exampleCompletion]);
};