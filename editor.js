import { EditorView, basicSetup } from "codemirror"
import { tags } from "@lezer/highlight"
import { HighlightStyle, syntaxHighlighting,indentService,indentUnit } from "@codemirror/language"
import { example } from "./lang/netlogo.js"

const myHighlightStyle = HighlightStyle.define([
  { tag: tags.strong, color: "#007F69", "font-weight": "bold" },
  { tag: tags.variableName, color: "#0000AA" },
  { tag: tags.string, color: "#963700" },
  { tag: tags.lineComment, color: "#5A5A5A" },
  { tag: tags.bool, color: "#660096" }
])

const indentPlainTextExtension = indentService.of((context, pos) => {
  const previousLine = context.lineAt(pos, -1)
  return previousLine.text.match(/^(\s)*/)[0].length
})

let editor = new EditorView({
  doc: "to setup\n  ask patches [ set pcolor green ]\n  ;set color to green\nend",
  extensions: [basicSetup, example(), syntaxHighlighting(myHighlightStyle),indentPlainTextExtension],
  parent: document.body
})
