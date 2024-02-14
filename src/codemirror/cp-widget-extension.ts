import { WidgetType, EditorView, Decoration, DecorationSet, ViewPlugin, ViewUpdate } from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';
import { Range } from '@codemirror/rangeset';
import { ColorPicker } from '@netlogo/netlogo-color-picker';

/** Color conversion helper functions (temporary) --> where can we get netlogo colors to rgb? */
/** netlogoColorToHex: Converts NetLogo color to its hex string. */
var colorTimesTen: number;
var baseIndex: number;
var r, g, b: number;
var step: number;

const baseColorsToRGB: { [key: string]: string } = {
  gray: 'rgb(140, 140, 140)',
  red: 'rgb(215, 48, 39)',
  orange: 'rgb(241, 105, 19)',
  brown: 'rgb(156, 109, 70)',
  yellow: 'rgb(237, 237, 47)',
  green: 'rgb(87, 176, 58)',
  lime: 'rgb(42, 209, 57)',
  turquoise: 'rgb(27, 158, 119)',
  cyan: 'rgb(82, 196, 196)',
  sky: 'rgb(43, 140, 190)',
  blue: 'rgb(50, 92, 168)',
  violet: 'rgb(123, 78, 163)',
  magenta: 'rgb(166, 25, 105)',
  pink: 'rgb(224, 126, 149)',
  black: 'rgb(0, 0, 0)',
  white: 'rgb(255, 255, 255)',
};

/** colorToNumberMapping: maps the NetLogo Base colors to their corresponding numeric value  */
const colorToNumberMapping: { [key: string]: number } = {
  gray: 5,
  red: 15,
  orange: 25,
  brown: 35,
  yellow: 45,
  green: 55,
  lime: 65,
  turquoise: 75,
  cyan: 85,
  sky: 95,
  blue: 105,
  violet: 115,
  magenta: 125,
  pink: 135,
  black: 145,
  white: 155,
};

/** netlogoBaseColors: Map of NetLogo Base colors to [r, g, b] form */
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

/**  cachedNetlogoColors: Creates a cache of netlogo colors */
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

/** netlogoToRGB: converts netlogo colors to rgb string  */
function netlogoToRGB(netlogoColor: number): string {
  let temp: number[] = cached[Math.floor(netlogoColor * 10)];
  return `rgb(${temp[0]}, ${temp[1]}, ${temp[2]})`;
}

/* compoundToRGB: return the compound string (red + 5) to a regular number */
function compoundToRGB(content: string): string {
  let stringSplit = content.split(' ');
  try {
    if (stringSplit[1] == '+') {
      return netlogoToRGB(colorToNumberMapping[stringSplit[0]] + Number(stringSplit[2]));
    } else if (stringSplit[1] == '-') {
      return netlogoToRGB(colorToNumberMapping[stringSplit[0]] - Number(stringSplit[2]));
    }
  } catch {
    return '';
  }
  return '';
}

/** netlogoArrToRGB: returns the rgb string from a netlogo color array */
function netlogoArrToRGB(inputString: string) {
  // Check for valid opening and closing brackets
  if (!inputString.startsWith('[') || !inputString.endsWith(']')) {
    return '';
  }
  const numbers = inputString
    .slice(1, -1)
    .split(/\s+/)
    .filter((n) => n);
  if (numbers.length === 3 || numbers.length === 4) {
    const validNumbers = numbers.map(Number).every((num) => !isNaN(num) && num >= 0 && num <= 255);

    if (validNumbers) {
      if (numbers.length === 3) {
        return `rgb(${numbers.join(', ')})`;
      } else {
        return `rgba(${numbers.join(', ')})`;
      }
    }
  }
  return '';
}

/** netlogoToCompound: Converts a numeric NetLogo Color to a compound color string */
function netlogoToCompound(netlogoColor: number): string {
  let baseColorIndex = Math.floor(netlogoColor / 10);
  let baseColorName = Object.keys(baseColorsToRGB)[baseColorIndex];
  // Calculate offset and immediately round to one decimal point
  let offset = Number(((netlogoColor % 10) - 5).toFixed(1));

  if (offset === 0) {
    // If the color is a base color, return only the base color name
    return baseColorName;
  } else if (offset > 0) {
    return `${baseColorName} + ${offset}`;
  } else {
    return `${baseColorName} - ${Math.abs(offset)}`;
  }
}

/**  extractRGBValues: takes an rgb string andr returns an rgba array*/
function extractRGBValues(rgbString: string) {
  const regex = /rgba?\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})(?:,\s*(\d{1,3}|\d\.\d+))?\)/;
  const match = rgbString.match(regex);
  if (match) {
    let values = match.slice(1, 4).map(Number);
    // Check if the alpha value exists; if not, default to 255
    const alpha = match[4] === undefined ? 255 : Number(match[4]);
    values.push(alpha);
    return values;
  }
  return [];
}

/** ColorPickerWidget: Defines a ColorPicker widget of WidgetType */
class ColorPickerWidget extends WidgetType {
  private color: string; // color of the section associated with the widget
  private length: number; // length of the color section associated with the widget
  /** colorType: the representation of the color:
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

  getColorType(): string {
    return this.colorType;
  }

  /** toDOM: defines the DOM appearance of the widget. Not connected to the widget as per CodeMirror documentation */
  toDOM() {
    let wrap = document.createElement('span');
    wrap.setAttribute('aria-hidden', 'true');
    wrap.className = 'netlogo-color-picker-widget';
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

  ignoreEvent() {
    return false;
  }
}

/** testValidColor: returns the color of a SyntaxNode's text as rgba string. If the text is not a valid color, returns an empty string  */
function testValidColor(content: string): string[] {
  content = content.trim();
  if (!content) return [''];
  let number = Number(content);
  // check if its a netlogo numeric color
  if (!isNaN(number) && number >= 0 && number < 140) return [netlogoToRGB(number), 'numeric'];
  // check if its one of the constants base color
  if (baseColorsToRGB[content]) return [baseColorsToRGB[content], 'compound'];
  // check if its of form array
  let arrAsRGB = netlogoArrToRGB(content);
  if (arrAsRGB) return [arrAsRGB, 'array'];
  return [compoundToRGB(content), 'compound'];
}

/** colorWidgets: Parses the visibleRange of the editor looking for colorWidget positions  */
function colorWidgets(view: EditorView, posToWidget: Map<number, ColorPickerWidget>) {
  let widgets: Range<Decoration>[] = [];
  for (let { from, to } of view.visibleRanges) {
    syntaxTree(view.state).iterate({
      from,
      to,
      enter: (node) => {
        if (node.name == 'VariableName') {
          let nodeStr = view.state.doc.sliceString(node.from, node.to);
          if (nodeStr.includes('color')) {
            let sibling = node.node.nextSibling;
            // check if node color is valid
            if (sibling) {
              let color: string[] = testValidColor(view.state.doc.sliceString(sibling.from, sibling.to)); // [<color as rgb>, <color type>]
              if (color[0] == '') {
                return;
              }
              let cpWidget = new ColorPickerWidget(color[0], sibling.to - sibling.from, color[1]);
              let deco = Decoration.widget({
                widget: cpWidget,
                side: 1,
              });
              widgets.push(deco.range(sibling.to));
              // add widget to the hashmap
              posToWidget.set(sibling.to, cpWidget);
            }
          }
        }
      },
    });
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
  console.log(widget.getLength());

  const colorPicker = new ColorPicker(
    cpDiv,
    (selectedColor) => {
      let newValue;
      // format corectly based on cpDiv
      switch (widget.getColorType()) {
        case 'compound':
          newValue = netlogoToCompound(selectedColor[1]);
          break;
        case 'numeric':
          newValue = selectedColor[1].toString();
          break;
        case 'array':
          newValue = `[${selectedColor[0][0]} ${selectedColor[0][1]} ${selectedColor[0][2]} ${selectedColor[0][3]}]`;
      }
      let change = { from: pos - widget.getLength(), to: pos, insert: newValue };
      view.dispatch({ changes: change });
      cpDiv.remove();
    },
    extractRGBValues(widget.getColor())
  ); // Initial color
}

/** ColorPickerPlugin: Main driver of the plugin. Creates a ColorPicker instance when a widget is pressed. Maintains a mapping of widgets to their position */
const ColorPickerPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    posToWidget: Map<number, ColorPickerWidget>;
    constructor(view: EditorView) {
      this.posToWidget = new Map();
      this.decorations = colorWidgets(view, this.posToWidget);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged || syntaxTree(update.startState) != syntaxTree(update.state))
        // update, refresh the map
        this.posToWidget.clear();
      this.decorations = colorWidgets(update.view, this.posToWidget);
    }

    handleMouseDown(e: MouseEvent, view: EditorView) {
      let target = e.target as HTMLElement;
      if (target.nodeName == 'DIV' && target.parentElement!.classList.contains('netlogo-color-picker-widget')) {
        console.log(this.posToWidget);
        initializeCP(view, view.posAtDOM(target), this.posToWidget.get(view.posAtDOM(target))!);
      }
    }
  },
  {
    decorations: (v) => v.decorations,

    eventHandlers: {
      mousedown: function (e: MouseEvent, view: EditorView) {
        this.handleMouseDown(e, view);
      },
    },
  }
);

export { ColorPickerPlugin };
