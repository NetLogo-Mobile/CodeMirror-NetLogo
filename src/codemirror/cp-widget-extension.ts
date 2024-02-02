import { WidgetType, EditorView, Decoration, DecorationSet, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { Range } from "@codemirror/rangeset";
import { netlogoToRGB, baseColorsToRGB, compoundToRGB, netlogoArrToRGB, extractRGBValues } from "src/utils/colors";
import { ColorPicker } from "@netlogo/netlogo-color-picker";

class ColorPickerWidget extends WidgetType {
  private color: string;  // color of the section associated with the widget 
  private length: number; // length of the color section associated with the widget 
  /** colorType: the representation of the color:
   * 'base' --> netlogo base color ( red )
   * 'compound' --> netlogo compound color ( red + 5 )
   * 'numeric' --> netlogo color numeric value: ( 45 )
   * 'array' --> rgba or rgb values : [25 13 12], [25 89 97 24]
   */
  private colorType: string;
  constructor(color: string, length: number, type: string) { 
    super();
    this.color = color;
    this.length = length;
    this.colorType = type;
  }

  getColor(): string {
    return this.color;
  }

  getLength(): number {
    return this.length;
  }

  toDOM() {
    let wrap = document.createElement("span");
    wrap.setAttribute("aria-hidden", "true");
    wrap.className = "netlogo-color-picker-widget";
    let box = wrap.appendChild(document.createElement('div'));
    box.style.width = '9px';
    box.style.height = '9px';
    box.style.border = '1px solid gray';
    box.style.borderRadius = '20%';
    box.style.backgroundColor = this.color;
    box.style.backgroundColor = this.color;
    box.style.display = 'inline-block';
    box.style.cursor = 'pointer';
    box.style.marginLeft = '5px';
    return wrap;
  }

  ignoreEvent() { return false }
}

/** testValidColor: returns the color of a SyntaxNode's text as rgba string. If the text is not a valid color, returns an empty string  */
function testValidColor(content: string): string[] {
  content = content.trim();
  if (!content) return [''];
  let number = Number(content);
  // check if its a netlogo numeric color
  if(!isNaN(number) && (number >= 0 && number < 140)) return [netlogoToRGB(number), 'numeric'];
  // check if its one of the constants base color
  if(baseColorsToRGB[content]) return [baseColorsToRGB[content], 'base'];
  // check if its of form array 
  let arrAsRGB = netlogoArrToRGB(content);
  if(arrAsRGB) return [arrAsRGB, 'array'];
  // check if its one of the compound colors (red + 5 ), otherwise it will return ''
  return [compoundToRGB(content), 'compound'];
}


function colorWidgets(view: EditorView, posToWidget: Map<number, ColorPickerWidget>) {
  let widgets: Range<Decoration>[] = [];
  for (let {from, to} of view.visibleRanges) {
    syntaxTree(view.state).iterate({
      from, to,
      enter: (node) => {
        if(node.name == "VariableName") {
          let nodeStr = view.state.doc.sliceString(node.from, node.to);
          if(nodeStr.includes("color")) {
            let sibling = node.node.nextSibling;
            // check if node color is valid
            if(sibling) {
              let color: string[] = testValidColor(view.state.doc.sliceString(sibling.from, sibling.to)); // [<color as rgb>, <color type>]
              if(color[0] == '') {
                return;
              }
              let cpWidget = new ColorPickerWidget(color[0], node.to - node.from, color[1]);
              let deco = Decoration.widget({
                widget: cpWidget,
                side: 1
              })
              widgets.push(deco.range(sibling.to));
              // add widget to the hashmap
              posToWidget.set(sibling.to, cpWidget);
            }
          }
        }
      }
    })
  }
  return Decoration.set(widgets);
}

/** intializeCP: creates an instance of a ColorPicker */
function initializeCP(view: EditorView, pos: number, widget: ColorPickerWidget) {
  // Check if the ColorPicker is already open
  let CPOpen = document.querySelector('#colorPickerDiv');
  if (CPOpen) {
    return; // ColorPicker is already open
  }
  let cpDiv = document.createElement('div');
  cpDiv.id = 'colorPickerDiv';
  cpDiv.style.position = 'absolute';
  view.dom.appendChild(cpDiv);

  const colorPicker = new ColorPicker(cpDiv, (selectedColor) => {
    let newValue = '';
    let change = {from: pos - widget.getLength(), to: pos, insert: newValue}
    view.dispatch({changes: change})
    cpDiv.remove();
  }, extractRGBValues(widget.getColor())); // Initial color
}

/** ColorPickerPlugin: creates  */
const ColorPickerPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    posToWidget: Map<number, ColorPickerWidget>;
    constructor(view: EditorView) {
      this.posToWidget = new Map();
      this.decorations = colorWidgets(view, this.posToWidget);
    }

    update(update: ViewUpdate) {
      if(update.docChanged || update.viewportChanged || syntaxTree(update.startState) != syntaxTree(update.state))
        // update, refresh the map
        this.posToWidget.clear();
        this.decorations = colorWidgets(update.view, this.posToWidget);
    }

    handleMouseDown(e: MouseEvent, view: EditorView) {
      let target = e.target as HTMLElement;
      if(target.nodeName == "DIV" && target.parentElement!.classList.contains("netlogo-color-picker-widget")) {
        console.log(this.posToWidget);
        initializeCP(view, view.posAtDOM(target), this.posToWidget.get(view.posAtDOM(target))!);
      }
    }
  }, {
    decorations: v => v.decorations,

    eventHandlers: {
      mousedown: function (e: MouseEvent, view: EditorView) {
        this.handleMouseDown(e, view);
      },
    },
});



export { ColorPickerPlugin }