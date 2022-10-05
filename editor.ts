import { EditorView, basicSetup } from "codemirror"
import { tags } from "@lezer/highlight"
import { HighlightStyle, syntaxHighlighting, indentService, indentUnit } from "@codemirror/language"
import { NetLogo } from "./lang/netlogo.js"

// Those code need to be moved
const myHighlightStyle = HighlightStyle.define([
  { tag: tags.strong, color: "#007F69", "font-weight": "bold" },
  { tag: tags.variableName, color: "#0000AA" },
  { tag: tags.string, color: "#963700" },
  { tag: tags.lineComment, color: "#5A5A5A" },
  { tag: tags.bool, color: "#660096" }
]);

const indentPlainTextExtension = indentService.of((context, pos) => {
  const previousLine = context.lineAt(pos, -1);
  const match = previousLine.text.match(/^(\s)*/);
  if (match == null) return 0;
  return match[0].length;
});

/** GalapagosEditor: The editor component for NetLogo Web / Turtle Universe. */
export class GalapagosEditor {
  /** Constructor: Create an editor instance. */
  constructor(Parent: HTMLElement, Options: any) {
    let editor = new EditorView({
      doc: "to setup\n  ask patches [ set pcolor green ]\n  ;set color to green\nend",
      extensions: [basicSetup, NetLogo(), syntaxHighlighting(myHighlightStyle), indentPlainTextExtension],
      parent: Parent
    });
  }
}

/** Export classes globally. */
try {
  (window as any).GalapagosEditor = GalapagosEditor;
} catch (error) { }
