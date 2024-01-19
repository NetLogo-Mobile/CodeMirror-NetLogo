// widget for color picker
import { WidgetType } from '@codemirror/view';
import { SyntaxNodeRef } from '@lezer/common';
import { Decoration, DecorationSet, ViewUpdate, ViewPlugin, EditorView } from '@codemirror/view';
import { Range } from '@codemirror/rangeset';
import { syntaxTree } from '@codemirror/language';
import { TreeCursor } from '@lezer/common';
import { ColorPicker } from '@netlogo/netlogo-color-picker';

/* ColorPickerWidget: Decoration Widget to open ColorPicker */
class ColorPickerWidget extends WidgetType {
  private color: string;
  private length: number;
  private textType: string;
  constructor(widgetColor: string, length: number, textType: string) {
    super();
    this.color = widgetColor;
    this.length = length;
    this.textType = textType;
  }

  getLength(): number {
    return this.length;
  }

  getTextType(): string {
    return this.textType;
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
    box.style.backgroundColor = this.color;
    box.style.backgroundColor = this.color;
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

function nodeIsColor(node: SyntaxNodeRef, view: EditorView, cursor: TreeCursor) {
  const keywordIgnore = ['true', 'false', 'nobody', 'e', 'pi']; // constants to ignore
  if (
    node.name == 'Constant' &&
    !keywordIgnore.includes(view.state.doc.sliceString(node.from, node.to).toLowerCase())
  ) {
    return true;
  } else if (node.name == 'Numeric') {
    //create a TreeCursor of the visible ranges.
    cursor.moveTo(node.from, 1);
    // get previous word
    cursor.prev();
    if (view.state.doc.sliceString(cursor.from, cursor.to).includes('color')) return true; // number preceded by "color"
  }
  return false;
}

function colorWidgets(view: EditorView, posToWidget: Map<number, ColorPickerWidget>): DecorationSet {
  let widgets: Range<Decoration>[] = [];
  posToWidget.clear(); // create new mappings on change in view
  for (let { from, to } of view.visibleRanges) {
    let cursor: TreeCursor = syntaxTree(view.state).cursor(); // create a cursor per change in view
    syntaxTree(view.state).iterate({
      from,
      to,
      enter: (node) => {
        if (nodeIsColor(node, view, cursor)) {
          let parseVal: string = view.state.doc.sliceString(node.from, node.to);
          let widgetColor: number;
          let textType: string;
          if (Number.isNaN(parseFloat(parseVal))) {
            textType = 'string';
          } else {
            widgetColor = parseFloat(parseVal);
            textType = 'number';
          }
          let cp_widget = new ColorPickerWidget('blue', parseVal.length, textType);
          let deco = Decoration.widget({
            widget: cp_widget,
            side: 1,
          });
          widgets.push(deco.range(node.to));
          posToWidget.set(node.to, cp_widget);
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
    let textType = widget.getTextType();

    if (textType === 'number') {
      change = { from: pos - length, to: pos, insert: selectedColor.toString() };
      view.dispatch({ changes: change });
    } else {
    }
    cpDiv.remove();
  }, [25, 25, 245, 255]); // Initial color
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
