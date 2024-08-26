import { WidgetType, EditorView, Decoration, DecorationSet, ViewPlugin, ViewUpdate } from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';
import { Range } from '@codemirror/rangeset';
import ColorPicker from '@netlogo/netlogo-color-picker';
import * as colors from '@netlogo/netlogo-color-picker/dist/helpers/colors';

//savedColors for saving the saved colors of the color picker to be used for subsequent color picker creations
var savedColors: number[][] = [];

/**
 * Extracts RGB or RGBA values from a color string.
 * @param rgbString - A string in the format "rgb(r,g,b)" or "rgba(r,g,b,a)"
 * @returns An array of four numbers [r, g, b, a], or an empty array if parsing fails
 */
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

/** ColorPickerWidget: Defines a ColorPicker widget of WidgetType. This widget will appear in the cm-dom */
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
    clickable.style.border = '1rem solid transparent'; // we can adjust this to make it more or less sensitive
    clickable.style.top = '50%';
    clickable.style.left = '50%';
    clickable.style.transform = 'translate(-50%, -50%)';
    clickable.style.cursor = 'pointer';
    // * default color picker widget should be uninteractable. This is so it doesn't interfere with spacebar scrolling */
    wrap.style.pointerEvents = 'none';
    return wrap;
  }

  ignoreEvent(event: Event): boolean {
    return false;
  }
}

/**
 * Tests if the given content represents a valid NetLogo color and returns its RGB representation.
 * This function handles various NetLogo color formats:
 * - Numeric color values (0-139)
 * - Base color names
 * - RGB function syntax
 * - RGB/RGBA array syntax
 * - Compound color expressions
 *
 * @param content - The string to test for color validity
 * @returns An array where:
 *          - The first element is the RGB(A) string representation of the color, or an empty string if invalid
 *          - The second element is a string describing the type of color format detected
 */
function testValidColor(content: string): string[] {
  content = content.trim();
  if (!content) return [''];

  // Check if it's a netlogo numeric color
  let number = Number(content);
  if (!isNaN(number) && number >= 0 && number < 140) return [colors.netlogoToRGB(number), 'numeric'];

  // Check if it's one of the constants base color
  if (colors.baseColorsToRGB[content]) return [colors.baseColorsToRGB[content], 'compound'];

  // Check if it is of the form `rgb <num> <num> <num>`
  const rgbRegex = /^rgb\s+(\d+)\s+(\d+)\s+(\d+)$/i;
  const rgbMatch = content.match(rgbRegex);
  if (rgbMatch) {
    const [_, r, g, b] = rgbMatch;
    const rgbValues = [Number(r), Number(g), Number(b)];
    if (rgbValues.every((v) => v >= 0 && v <= 255)) {
      return [`rgb(${rgbValues.join(',')})`, 'rgbFn'];
    }
  }

  // check if it is the form `hsb <num> <num> <num>`
  const hsbRegex = /^hsb\s+(\d+)\s+(\d+)\s+(\d+)$/i;
  const hsbMatch = content.match(hsbRegex);
  if (hsbMatch) {
    const [_, h, s, b] = hsbMatch;
    const hsbValues = [Number(h), Number(s), Number(b)];
    if (
      hsbValues[0] >= 0 &&
      hsbValues[0] <= 360 &&
      hsbValues[1] >= 0 &&
      hsbValues[1] <= 100 &&
      hsbValues[2] >= 0 &&
      hsbValues[2] <= 100
    ) {
      // hsb val, convert
      const rgbValues = colors.HSBAToRGBA(hsbValues[0], hsbValues[1], hsbValues[2], 255).slice(0, -1);
      return [`rgb(${rgbValues.join(',')})`, 'hsbFn'];
    }
  }
  // Check if it's of form array
  let arrAsRGB = colors.netlogoArrToRGB(content);
  if (arrAsRGB) {
    const colorType = arrAsRGB.startsWith('rgba') ? 'rgbaArr' : 'rgbArr';
    return [arrAsRGB, colorType];
  }

  // catch all that should never happen
  return [colors.compoundToRGB(content), 'compound'];
}

/**
 * Parses the visible ranges of the editor to find and create color widgets.
 * @param view - The EditorView instance
 * @param posToWidget - A map to store widget positions
 * @returns A DecorationSet containing all created color widgets
 */
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

/**
 * Initializes and positions a ColorPicker instance.
 * The color picker is positioned this way to allow for centered display, based on the visible portion of the window
 * using flexbox, ensuring it's always visible regardless of scroll position.
 * @param view - The EditorView instance
 * @param pos - The position in the document where the color widget was clicked
 * @param widget - The ColorPickerWidget instance that was clicked
 * @param OnColorPickerCreate - Optional callback function to be called after color picker creation
 * @returns -1 if a color picker already exists, 0 on successful creation
 */
function initializeColorPicker(
  view: EditorView,
  pos: number,
  widget: ColorPickerWidget,
  OnColorPickerCreate?: (cpDiv: HTMLElement) => void
): number {
  // check for color picker existence
  const cpExist = document.querySelector('#colorPickerDiv');
  if (cpExist) {
    return -1;
  }
  // create a div to hold the color picker
  let cpDiv = document.createElement('div');
  document.body.appendChild(cpDiv);

  /** findCPPos: finds the pos where the cpDiv should be. The cp div should be in the top left corner of the window viewport, so a flexbox can center the color picker right in the center of the viewport **/
  const findAndSetCP = function () {
    cpDiv.id = 'colorPickerDiv';
    cpDiv.style.position = 'absolute';
    cpDiv.style.display = 'flex';
    cpDiv.style.justifyContent = 'center';
    cpDiv.style.alignItems = 'center';
    // first find the coordinate of the top left point in your viewport
    const x = window.scrollX || document.documentElement.scrollLeft;
    const y = window.scrollY || document.documentElement.scrollTop;
    const viewportW = window.innerWidth;
    const viewportY = window.innerHeight;
    // min to fit cp is 24rem by 27.8rem (384px by 444.8px ) so if it is less than the minimum, just use the minimum (this is kind of a hack solution, but I can't think of a better one)
    cpDiv.style.width = Math.max(384, viewportW) + 'px';
    cpDiv.style.height = Math.max(444.8, viewportY) + 'px';
    // Set the position of cpDiv
    cpDiv.style.left = `${x}px`;
    cpDiv.style.top = `${y}px`;
    document.body.appendChild(cpDiv);
  };

  findAndSetCP();

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
        case 'rgbArr':
          // return the number as [ r g b ], unless the alpha value is not 255 ( suggesting it was changed )
          if (selectedColor[3] == 255) {
            newValue = `[${selectedColor[0]} ${selectedColor[1]} ${selectedColor[2]}]`;
          } else {
            newValue = `[${selectedColor[0]} ${selectedColor[1]} ${selectedColor[2]} ${selectedColor[3]}]`;
          }
          break;
        case 'rgbaArr':
          newValue = `[${selectedColor[0]} ${selectedColor[1]} ${selectedColor[2]} ${selectedColor[3]}]`;
          break;
        case 'rgbFn':
          newValue = `rgb ${selectedColor[0]} ${selectedColor[1]} ${selectedColor[2]}`;
          break;
        case 'hsbFn':
          // convert back to rgba first
          const asHsb = colors.RGBAToHSBA(selectedColor[0], selectedColor[1], selectedColor[2], 255).slice(0, -1);
          newValue = `hsb ${asHsb[0]} ${asHsb[1]} ${asHsb[2]}`;
          break;
      }

      let change = {
        from: pos - widget.getLength(),
        to: pos,
        insert: newValue,
      };
      view.dispatch({ changes: change });
      // call destroyColorPicker after processing the selected color
      destroyColorPicker();
    },
    savedColors: savedColors,
  };

  // create the color picker, and open to the right mode based on the widget type
  let openTo = 'grid'; // default is grid
  if (widget.getColorType() == 'rgbArr' || widget.getColorType() == 'rgbFn') {
    openTo = 'slider';
  }
  if (widget.getColorType() == 'hsbFn') {
    openTo = 'sliderHSB';
  }
  const colorPicker = new ColorPicker(colorPickerConfig, openTo);
  cpDiv.addEventListener('click', handleOutsideClick);
  if (OnColorPickerCreate) OnColorPickerCreate(cpDiv);

  // hide the virtual keyboard if eligible
  (navigator as any).virtualKeyboard?.hide();

  return 0;
}

/**
 * Removes the color picker from the DOM and cleans up associated event listeners.
 */
function destroyColorPicker() {
  const cpDiv = document.querySelector('#colorPickerDiv');
  if (cpDiv) {
    // Remove the event listener before removing the div
    cpDiv.removeEventListener('click', handleOutsideClick);
    cpDiv.remove();
  }
}

//separate click handler so we can both add and remove it
function handleOutsideClick(event: Event) {
  const cpDiv = event.currentTarget as HTMLElement;
  if (event.target === cpDiv) {
    destroyColorPicker();
  }
}

/**
 * Creates and returns the main ColorPicker plugin for CodeMirror.
 * @param OnColorPickerCreate - Optional callback function to be called after color picker creation
 * @returns A ViewPlugin instance that can be added to the CodeMirror editor
 */
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
        if (update.docChanged || update.viewportChanged || syntaxTree(update.startState) != syntaxTree(update.state)) {
          this.posToWidget.clear();
          this.decorations = colorWidgets(update.view, this.posToWidget);
        }
      }

      /** setWidgetsZindex: Helper function to change the ZIndex briefly to make widget interactable */
      setWidgetsInteractability(view: EditorView, pointerValue: string) {
        view.dom.querySelectorAll('.cp-widget-wrap').forEach((el) => {
          if (el instanceof HTMLElement) {
            el.style.pointerEvents = pointerValue;
          }
        });
      }
    },

    {
      decorations: (v) => v.decorations,
      eventHandlers: {
        mousedown: function (e: MouseEvent, view: EditorView) {
          this.setWidgetsInteractability(view, 'auto');
          // if we are pressing the editor, close the color picker. This is necessary because the cpDiv won't cover the entire screen if the viewport is changed
          destroyColorPicker();
        },

        touchstart: function (e: TouchEvent, view: EditorView) {
          let touch = e.touches[0];
          this.setWidgetsInteractability(view, 'auto');
          // if we are pressing the editor, close the color picker. This is necessary because the cpDiv won't cover the entire screen if the viewport is changed
          destroyColorPicker();
          // don't bring the keyboard if we pressed on the picker
          let target = touch.target as HTMLElement;
          if (target.nodeName == 'DIV' && target.parentElement!.classList.contains('cp-widget-wrap')) {
            e.preventDefault();
          }
        },

        mouseup: function (e: MouseEvent, view: EditorView) {
          let target = e.target as HTMLElement;
          if (target.nodeName == 'DIV' && target.parentElement!.classList.contains('cp-widget-wrap')) {
            e.preventDefault();
            initializeColorPicker(
              view,
              view.posAtDOM(target),
              this.posToWidget.get(view.posAtDOM(target))!,
              OnColorPickerCreate
            );
          }
          // set the zindex of the picker back to -1 for consistency
          this.setWidgetsInteractability(view, 'none');
        },

        touchend: function (e: TouchEvent, view: EditorView) {
          let touch = e.touches[0];
          let target = touch.target as HTMLElement;
          if (target.nodeName == 'DIV' && target.parentElement!.classList.contains('cp-widget-wrap')) {
            e.preventDefault();
            initializeColorPicker(
              view,
              view.posAtDOM(target),
              this.posToWidget.get(view.posAtDOM(target))!,
              OnColorPickerCreate
            );
          }
          // set the zindex of the picker back to -1 for consistency
          this.setWidgetsInteractability(view, 'none');
        },
      },
    }
  );
}

export { createColorPickerPlugin };
