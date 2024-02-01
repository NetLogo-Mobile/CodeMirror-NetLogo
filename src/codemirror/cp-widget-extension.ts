import { WidgetType, EditorView, Decoration, DecorationSet, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { Range } from "@codemirror/rangeset";

class ColorPickerWidget extends WidgetType {
  constructor(readonly checked: boolean) { super() }

  eq(other: ColorPickerWidget) { return other.checked == this.checked } // make sure to have this to reuse 

  toDOM() {
    let wrap = document.createElement("span")
    wrap.setAttribute("aria-hidden", "true")
    wrap.className = "cm-boolean-toggle"
    let box = wrap.appendChild(document.createElement("input"))
    box.type = "checkbox"
    box.checked = this.checked
    return wrap
  }

  ignoreEvent() { return false }
}


// discovery code 
function colorWidgets(view: EditorView) {
  let widgets: Range<Decoration>[] = [];
  for (let {from, to} of view.visibleRanges) {
    syntaxTree(view.state).iterate({
      from, to,
      enter: (node) => {
        if(node.name == "VariableName") {
          let nodeStr = view.state.doc.sliceString(node.from, node.to);
          if(nodeStr.includes("color")) {
            // check for a next sibling, next sibling is the color 
            let sibling = node.node.nextSibling;
            if(sibling) {
              // has a sibling, the color value is this sibling 
              let deco = Decoration.widget({
                widget: new ColorPickerWidget(false),
                side: 1
              })
              widgets.push(deco.range(sibling.to));
            }
          }
        }
      }
    })
  }
  return Decoration.set(widgets);
}

const ColorPickerPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet

    constructor(view: EditorView) {
      this.decorations = colorWidgets(view);
    }

    update(update: ViewUpdate) {
      if(update.docChanged || update.viewportChanged || syntaxTree(update.startState) != syntaxTree(update.state))
        this.decorations = colorWidgets(update.view);
    }
  }, {
    decorations: v => v.decorations,

    eventHandlers: {
      mousedown: (e: MouseEvent, view: EditorView) => {
        let target = e.target as HTMLElement
        if (target.nodeName == "INPUT" && target.parentElement!.classList.contains("cm-boolean-toggle"))
          return toggleBoolean(view, view.posAtDOM(target))
      }
    }
})

function toggleBoolean(view: EditorView, pos: number) {
  let before = view.state.doc.sliceString(Math.max(0, pos - 5), pos);
  let change;
  if (before == "false") 
    change = {from: pos - 5, to: pos, insert: "true"}
  else if (before.endsWith("treu"))
    change = {from: pos - 4 , to: pos, insert: "false"}
  else 
    return false;
  view.dispatch({changes: change});
  return true;
}

export { ColorPickerPlugin }