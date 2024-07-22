import { WidgetType, EditorView, Decoration, DecorationSet, ViewPlugin, ViewUpdate } from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';
import { Range } from '@codemirror/rangeset';
import ColorPicker from '@netlogo/netlogo-color-picker';
import * as colors from '@netlogo/netlogo-color-picker/dist/helpers/colors';

var savedColors: number[][] = [];

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
    wrap.className = 'cp-widget-wrap';
    wrap.style.position = 'relative';
    wrap.style.display = 'inline-block';

    let box = wrap.appendChild(document.createElement('div'));
    box.style.width = '0.5rem';
    box.style.height = '0.5rem';
    box.style.border = '1px solid gray';
    box.style.borderRadius = '20%';
    box.style.backgroundColor = this.color;
    box.style.display = 'inline-block';
    box.style.marginLeft = '0.3rem';
    box.style.marginRight = '0.3rem';
    box.style.verticalAlign = 'middle';
    box.classList.add('cp-widget-box');

    // overlay an invisible div to increase clickable area
    let clickable = wrap.appendChild(document.createElement('div'));
    clickable.style.position = 'absolute';
    clickable.style.top = '0';
    clickable.style.left = '0.125rem';
    clickable.style.border = '0.5rem solid transparent'; // we can adjust this to make it more or less sensitive
    clickable.style.top = '50%';
    clickable.style.left = '50%';
    clickable.style.transform = 'translate(-50%, -50%)';
    clickable.style.cursor = 'pointer';

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
  if (!isNaN(number) && number >= 0 && number < 140) return [colors.netlogoToRGB(number), 'numeric'];
  // check if its one of the constants base color
  if (colors.baseColorsToRGB[content]) {
    return [colors.baseColorsToRGB[content], 'compound'];
  }
  // check if its of form array
  let arrAsRGB = colors.netlogoArrToRGB(content);
  if (arrAsRGB) return [arrAsRGB, 'array'];
  return [colors.compoundToRGB(content), 'compound'];
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
              // if the color is a compound color, make sure to split by whitespace if it exists
              let color_end = sibling.to;
              let color_start = sibling.from;
              if (color[1] == 'compound') {
                let colorStr = view.state.doc.sliceString(sibling.from, sibling.to);
                let colorStrArr = colorStr.split(' ');
                // get the first number before the space
                if (colorStrArr.length > 3) {
                  let spaceIndex = colorStr.indexOf(colorStrArr[2]);
                  // there is a space, so we should ignore it, account for the length of the number as well
                  color_end = sibling.from + spaceIndex + colorStrArr[2].length;
                }
              }
              let cpWidget = new ColorPickerWidget(color[0], color_end - color_start, color[1]);
              let deco = Decoration.widget({
                widget: cpWidget,
                side: 1,
              });
              widgets.push(deco.range(color_end));
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
function initializeCP(
  view: EditorView,
  pos: number,
  widget: ColorPickerWidget,
  OnColorPickerCreate?: (cpDiv: HTMLElement) => void
): HTMLElement {
  let cpDiv = document.createElement('div');
  cpDiv.id = 'colorPickerDiv';

  const colorPickerConfig = {
    parent: cpDiv,
    initColor: extractRGBValues(widget.getColor()),
    onColorSelect: (cpReturn: [any, number[][]]) => {
      let newValue: string = '';
      // cpReturn is an array of the selected color as well as the saved colors array
      const selectedColor: number[] = cpReturn[0].rgba;
      savedColors = cpReturn[1];

      // format correctly based on cpDiv
      switch (widget.getColorType()) {
        case 'compound':
          newValue = colors.netlogoToCompound(colors.rgbToNetlogo(selectedColor));
          break;
        case 'numeric':
          newValue = colors.rgbToNetlogo(selectedColor).toString();
          break;
        case 'array':
          newValue = `[${selectedColor[0]} ${selectedColor[1]} ${selectedColor[2]} ${selectedColor[3]}]`;
      }

      let change = {
        from: pos - widget.getLength(),
        to: pos,
        insert: newValue,
      };
      view.dispatch({ changes: change });
      cpDiv.remove();
    },
    savedColors: savedColors,
  };

  const colorPicker = new ColorPicker(colorPickerConfig);
  if (OnColorPickerCreate) {
    OnColorPickerCreate(cpDiv);
  }
  return cpDiv;
}

/** ColorPickerPlugin: Main driver of the plugin. Creates a ColorPicker instance when a widget is pressed. Maintains a mapping of widgets to their position */
function createColorPickerPlugin(OnColorPickerCreate?: (cpDiv: HTMLElement) => void) {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      posToWidget: Map<number, ColorPickerWidget>;

      constructor(view: EditorView) {
        this.posToWidget = new Map();
        this.decorations = colorWidgets(view, this.posToWidget);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged || syntaxTree(update.startState) != syntaxTree(update.state))
          this.posToWidget.clear();
        this.decorations = colorWidgets(update.view, this.posToWidget);
      }
    },
    {
      decorations: (v) => v.decorations,
      eventHandlers: {
        mousedown: function (e: MouseEvent, view: EditorView) {
          let target = e.target as HTMLElement;
          if (target.nodeName == 'DIV' && target.parentElement!.classList.contains('cp-widget-wrap')) {
            e.preventDefault();
            let div = initializeCP(
              view,
              view.posAtDOM(target),
              this.posToWidget.get(view.posAtDOM(target))!,
              OnColorPickerCreate
            );
          }
        },
        touchstart: function (e: TouchEvent, view: EditorView) {
          let touch = e.touches[0];
          let target = touch.target as HTMLElement;
          if (target.nodeName == 'DIV' && target.parentElement!.classList.contains('cp-widget-wrap')) {
            e.preventDefault();
            let div = initializeCP(
              view,
              view.posAtDOM(target),
              this.posToWidget.get(view.posAtDOM(target))!,
              OnColorPickerCreate
            );
          }
        },
      },
    }
  );
}

export { createColorPickerPlugin };
