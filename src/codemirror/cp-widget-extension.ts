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

const colorToNumberMapping: {[key:string]: number} = {
  'gray': 5,
  'red': 15,
  'orange': 25,
  'brown': 35,
  'yellow': 45,
  'green': 55,
  'lime': 65,
  'turquoise': 75,
  'cyan': 85,
  'sky': 95,
  'blue': 105,
  'violet': 115,
  'magenta': 125,
  'pink': 135,
  'black': 145,
  'white': 155,
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

function netlogoToText(netlogoColor: number): string {
  let baseColorIndex = Math.floor(netlogoColor / 10);
  let baseColorName = Object.keys(baseColorsToRGB)[baseColorIndex];
  let offset = (netlogoColor % 10) - 5;

  if (offset === 0) {
    // If the color is a base color, return only the base color name
    return baseColorName;
  } else if (offset > 0) {
    // For positive offset, include a space before the offset
    return `${baseColorName} + ${offset}`;
  } else {
    // For negative offset, include a space before the negative offset
    return `${baseColorName} - ${Math.abs(offset)}`;
  }
}


/* ColorPickerWidget: Decoration Widget to open ColorPicker */
class ColorPickerWidget extends WidgetType {
  private color: number[]; // rgb or rgba string 
  private length: number;
  /** colorType: the representation of the color:
   * 'text' --> anything like red, red + 3
   * 'number' --> netlogo color value: 45, 139.9
   * 'rgb' --> rgba or rgb values : [25, 13, 25], [35, 17, 25, 255]
   */
  private colorType: string; 
  constructor(widgetColor: number[], length: number, type: string) {
    super();
    this.color = widgetColor;
    this.length = length;
    this.colorType = type;
  }

  getLength(): number {
    return this.length;
  }

  getColorType(): string {
    return this.colorType;
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

4) -- color picker itself have the right color based on the starting color  -- done 

5) Make it accept colors of the form : set color [255 0 0 125]

6) Make it accept colors of the form: red + 4;

7) make it load the pictures 

colors:
3 modes
1) text representation: red, red +2 
2) netlogo color representation: 5, 25
3) rgb representatio: [255, 255, 255]
*/


function getNodeColor(node: SyntaxNodeRef, view: EditorView, cursor: TreeCursor): number[] {
  const ignore = ['true', 'false', 'nobody', 'e', 'pi']; //constants to ignore
  let nodeVal = view.state.doc.sliceString(node.from, node.to);
  if(node.name == 'Numeric') {
    if(parseFloat(nodeVal) >= 140 || parseFloat(nodeVal) < 0) {
      return [];
    }
    // check if previous word is color 
    cursor.moveTo(node.from, 1);
    cursor.prev();
    if(view.state.doc.sliceString(cursor.from, cursor.to).includes('color')) return [node.to, nodeVal.length, 0]
  } else if(node.name == 'Constant' && !ignore.includes(nodeVal.toLowerCase())) {
    // test if its of the form color + number 
    cursor.moveTo(node.to, 1);
    const colorPattern = /^[a-zA-Z]+ \+ [0-5]$/;
    if(colorPattern.test(view.state.doc.sliceString(cursor.from, cursor.to))) {
      return [cursor.to, cursor.to - cursor.from, 2];
    }
    return [node.to, nodeVal.length, 1];
  }
  return [];
}

function colorWidgets(view: EditorView, posToWidget: Map<number, ColorPickerWidget>): DecorationSet {
  let widgets: Range<Decoration>[] = [];
  posToWidget.clear();
  let colorNodeInfo: number[];
  for(let { from, to } of view.visibleRanges) {
    let cursor: TreeCursor = syntaxTree(view.state).cursor();
    syntaxTree(view.state).iterate({
      from,
      to,
      enter: (node) => {
        if((colorNodeInfo = getNodeColor(node, view, cursor)).length != 0) {
          let colorType;
          let color;
          if(colorNodeInfo[2] == 0) {
            // regular netlogo numeric color
            color = netlogoToRGB(parseFloat(view.state.doc.sliceString(node.from, node.to)));
            colorType = 'number'
          } else if(colorNodeInfo[2] == 1) {
            // regular base color
            color = baseColorsToRGB[view.state.doc.sliceString(node.from, node.to)];
            colorType = 'text';
          } else {
            // the color is of form rgb + 5 
            colorType = 'text';
            let string = view.state.doc.sliceString(colorNodeInfo[0] - colorNodeInfo[1], colorNodeInfo[1]);
            let stringSplit = string.split(" ");
            if(stringSplit[1] == '+') {
              color = netlogoToRGB(colorToNumberMapping[stringSplit[0]] + Number(stringSplit[2]));
            } else {
              color = netlogoToRGB(colorToNumberMapping[stringSplit[0]] - Number(stringSplit[2]));
            }
          }
          let cpWidget = new ColorPickerWidget(color, colorNodeInfo[1], colorType);
          let deco = Decoration.widget({
            widget: cpWidget,
            side: 1,
          });
          widgets.push(deco.range(colorNodeInfo[0]));
          posToWidget.set(colorNodeInfo[0], cpWidget);
        }
      }
    })
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
    let newValue;
    if (widget.getColorType() == 'number') {
      // newValue should be the color as netLogocolor
      newValue = String(selectedColor[1]);
    } 
    else if(widget.getColorType() == 'text') {
      // take the netlogo color and map it to the correct text
      newValue = netlogoToText(selectedColor[1]);
    }
    let change = {from: pos - widget.getLength(), to: pos, insert: newValue}
    view.dispatch({changes: change})
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
