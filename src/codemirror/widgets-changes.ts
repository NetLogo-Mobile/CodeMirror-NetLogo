import { EditorView, WidgetType } from '@codemirror/view';
import { Text } from '@codemirror/text';

/* TextWidget: A CM6 Widget representing some text and its styling. */
export class TextWidget extends WidgetType {
  constructor(private text: string, private className: string = '') {
    super();
  }
  toDOM() {
    let wrap = document.createElement('span');
    wrap.setAttribute('aria-hidden', 'true');
    wrap.className = `cm-text ${this.className}`;
    wrap.textContent = this.text;
    return wrap;
  }
}

/* CheckboxWidget: A "checkbox" DOM feature to accept changes. */
export class CheckboxWidget extends WidgetType {
  private readonly CodeMirror: EditorView;
  constructor(editor: EditorView) {
    super();
    this.CodeMirror = editor;
  }
  toDOM() {
    let wrap = document.createElement('span');
    wrap.setAttribute('aria-hidden', 'true');
    let box = wrap.appendChild(document.createElement('input'));
    box.type = 'checkbox';
    return wrap;
  }

  ignoreEvent() {
    return false;
  }
}
