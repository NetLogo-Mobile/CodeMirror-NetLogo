// widget for color picker
import { WidgetType } from '@codemirror/view';
import { SyntaxNodeRef } from '@lezer/common';
import { Decoration, DecorationSet, ViewUpdate, ViewPlugin, EditorView } from '@codemirror/view';
import { Range } from '@codemirror/rangeset';
import { syntaxTree } from '@codemirror/language';
import { TreeCursor } from '@lezer/common';
import { ColorPicker } from '@netlogo/netlogo-color-picker';


/** Color helpers (temporary) --> where can we get netlogo colors to rgb? */
/** netlogoColorToHex: Converts NetLogo color to its hex string. */
var colorTimesTen: number;
var baseIndex: number;
var r, g, b: number;
var step: number;

const baseColorsToRGB: { [key: string]: number[] } = {
  gray: [140, 140, 140],
  red: [215, 48, 39],
  orange: [241, 105, 19],
  brown: [156, 109, 70],
  yellow: [237, 237, 47],
  green: [87, 176, 58],
  lime: [42, 209, 57],
  turquoise: [27, 158, 119],
  cyan: [82, 196, 196],
  sky: [43, 140, 190],
  blue: [50, 92, 168],
  violet: [123, 78, 163],
  magenta: [166, 25, 105],
  pink: [224, 126, 149],
  black: [0, 0, 0],
  white: [255, 255, 255],
};

const netlogoBaseColors: [number, number, number][] = [
  [140, 140, 140], // gray       (5)
  [215, 48, 39], // red       (15)
  [241, 105, 19], // orange    (25)
  [156, 109, 70], // brown     (35)
  [237, 237, 47], // yellow    (45)
  [87, 176, 58], // green     (55)
  [42, 209, 57], // lime      (65)
  [27, 158, 119], // turquoise (75)
  [82, 196, 196], // cyan      (85)
  [43, 140, 190], // sky       (95)
  [50, 92, 168], // blue     (105)
  [123, 78, 163], // violet   (115)
  [166, 25, 105], // magenta  (125)
  [224, 126, 149], // pink     (135)
  [0, 0, 0], // black
  [255, 255, 255], // white
];
let cachedNetlogoColors = (function () {
  var k, results;
  results = [];
  for (colorTimesTen = k = 0; k <= 1400; colorTimesTen = ++k) {
    baseIndex = Math.floor(colorTimesTen / 100);
    [r, g, b] = netlogoBaseColors[baseIndex];
    step = ((colorTimesTen % 100) - 50) / 50.48 + 0.012;
    if (step < 0) {
      r += Math.floor(r * step);
      g += Math.floor(g * step);
      b += Math.floor(b * step);
    } else {
      r += Math.floor((0xff - r) * step);
      g += Math.floor((0xff - g) * step);
      b += Math.floor((0xff - b) * step);
    }
    results.push([r, g, b]);
  }
  return results;
})();
let cached: number[][] = cachedNetlogoColors;

function netlogoToRGB(netlogoColor: number): number[] {
  let temp: number[] = cached[Math.floor(netlogoColor * 10)];
  return [temp[0], temp[1], temp[2]];
}

/* ColorPickerWidget: Decoration Widget to open ColorPicker */
class ColorPickerWidget extends WidgetType {
  private color: number[]; // rgb or rgba string 
  private length: number;
  // true if the color associated with the widget is a netlogo color
  private isNetLogoColor: boolean;
  constructor(widgetColor: number[], length: number, type: boolean) {
    super();
    this.color = widgetColor;
    this.length = length;
    this.isNetLogoColor = type;
  }

  getLength(): number {
    return this.length;
  }

  isNetLogo() {
    return this.isNetLogoColor;
  }

  getColor(): number[] {
    if(this.color.length == 4) {
      return this.color;
    } else {
      return [this.color[0], this.color[1], this.color[2], 255];
    }
  }

  toDOM(): HTMLElement {
    let wrap = document.createElement('span');
    wrap.setAttribute('aria-hidden', 'true');
    wrap.className = 'netlogo-colorpicker';
    let box = wrap.appendChild(document.createElement('div'));
    box.style.width = '9px';
    box.style.height = '9px';
    box.style.border = '1px solid gray';
    box.style.borderRadius = '20%';
    let color = this.color;
    if(this.color.length == 3) {
      box.style.backgroundColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
    } else {
      // rgba
      box.style.backgroundColor = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]})`;
    }
    // box.style.backgroundColor = `rgb${}`
    box.style.display = 'inline-block';
    box.style.cursor = 'pointer';
    box.style.marginLeft = '5px';
    // set data field to length
    return wrap;
  }

  ignoreEvent() {
    return false;
  }
}

/* ColorPicker Extension */

/* to do:

1) Make nodeIsColor return the color itself --> maybe return null if its not a color, returns the color itself as the color --> aggregate the color to be the same type --> rgba -- done 

2) Make the node itself be the right color -- done 

3) Make the colorPicker widget change the color based on the callback 

4) -- color picker itself have the right color based on the starting color 
*/



/** getNodeColor: returns the color of a node given the node as a string. Returns empty string if not a color*/
function getNodeColor(node: SyntaxNodeRef, view: EditorView, cursor: TreeCursor): string {
  const ignore = ['true', 'false', 'nobody', 'e', 'pi']; //constants to ignore
  let nodeVal = view.state.doc.sliceString(node.from, node.to);
  if(
    node.name == 'Constant' && 
    !ignore.includes(nodeVal.toLowerCase()) 
  ) {
    return nodeVal;
  } else if(node.name == 'Numeric') {
    if(parseFloat(nodeVal) >= 140 || parseFloat(nodeVal) < 0) {
      return '';
    }
    // check if previous word is 'color'
    cursor.moveTo(node.from, 1);
    cursor.prev();
    if(view.state.doc.sliceString(cursor.from, cursor.to).includes('color')) return nodeVal;
  }
  return '';
}


function colorWidgets(view: EditorView, posToWidget: Map<number, ColorPickerWidget>): DecorationSet {
  let widgets: Range<Decoration>[] = [];
  posToWidget.clear();
  let nodeVal: string;
  for (let { from, to } of view.visibleRanges) {
    let cursor: TreeCursor = syntaxTree(view.state).cursor();
    syntaxTree(view.state).iterate({
      from,
      to,
      enter: (node) => {
        if((nodeVal = getNodeColor(node, view, cursor)) != '') {
          // determine the color type
          let isNetLogo;
          if(Number.isNaN(parseFloat(nodeVal))) {
            isNetLogo = false;  // isNetLogo color 
          }else {
            isNetLogo = true;
          }
          // translate to rgb if netlogoColor 
          let color:number[];
          if(isNetLogo) {
            color = netlogoToRGB(parseFloat(nodeVal));
          } else {
            // it is a string 
            console.log(nodeVal);
            color = baseColorsToRGB[nodeVal]
          }
          let cpWidget = new ColorPickerWidget(color, nodeVal.length, isNetLogo);
          let deco = Decoration.widget({
            widget: cpWidget,
            side: 1,
          });
          widgets.push(deco.range(node.to));
          posToWidget.set(node.to, cpWidget);
        }
      },
    });
  }
  return Decoration.set(widgets);
}

function initializeCP(view: EditorView, pos: number, widget: ColorPickerWidget) {
  // Check if the ColorPicker is already open
  let CPOpen = document.querySelector('#colorPickerDiv');
  if (CPOpen) {
    return; // ColorPicker is already open
  }

  // Create and append the ColorPicker div
  let cpDiv = document.createElement('div');
  cpDiv.id = 'colorPickerDiv';
  cpDiv.style.position = 'absolute';
  view.dom.appendChild(cpDiv);

  // Initialize the ColorPicker with a callback
  const colorPicker = new ColorPicker(cpDiv, (selectedColor) => {
    console.log(selectedColor);

    let change;
    let length = widget.getLength();

    if (widget.isNetLogo()) {
      change = { from: pos - length, to: pos, insert: selectedColor.toString() };
      view.dispatch({ changes: change });
    } else {
    }
    cpDiv.remove();
  }, widget.getColor()); // Initial color
}


export const ColorPickerPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    posToWidget: Map<number, ColorPickerWidget>;

    constructor(view: EditorView) {
      this.posToWidget = new Map();
      this.decorations = colorWidgets(view, this.posToWidget);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) this.decorations = colorWidgets(update.view, this.posToWidget);
    }
    handleMousedown(e: MouseEvent, view: EditorView) {
      let target = e.target as HTMLElement;
      if (target.nodeName == 'DIV' && target.parentElement!.classList.contains('netlogo-colorpicker')) {
        initializeCP(view, view.posAtDOM(target), this.posToWidget.get(view.posAtDOM(target))!);
      }
    }
  },
  {
    decorations: (v) => v.decorations,
    eventHandlers: {
      mousedown: function (e, view) {
        this.handleMousedown(e, view);
      },
    },
  }
);
