import { EditorView, basicSetup } from "codemirror"
import { tags } from "@lezer/highlight"
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language"
import { example } from "./lang/netlogo.js"

const myHighlightStyle = HighlightStyle.define([
  { tag: tags.strong, color: "#007F69", "font-weight": "bold" },
  { tag: tags.variableName, color: "#0000AA" },
  { tag: tags.string, color: "#963700" },
  { tag: tags.lineComment, color: "#5A5A5A" },
  { tag: tags.bool, color: "#660096" }
])

let editor = new EditorView({
  doc: "to setup\n\task patches [ set pcolor green ]\n\t;set color to green\nend",
  extensions: [basicSetup, example(), syntaxHighlighting(myHighlightStyle)],
  parent: document.body
})
