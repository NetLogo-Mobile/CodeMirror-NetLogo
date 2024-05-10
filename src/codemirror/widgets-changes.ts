import { EditorView, WidgetType } from '@codemirror/view';
import { Text } from '@codemirror/text';

/* TextWidget: A CM6 Widget representing some text and its styling. */
export class TextWidget extends WidgetType {
  constructor(
    private text: string,
    private className: string = ''
  ) {
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
  private readonly CurrentVersion: string;
  constructor(editor: EditorView, finalText: string) {
    super();
    this.CodeMirror = editor;
    this.CurrentVersion = finalText;
  }
  toDOM() {
    let wrap = document.createElement('span');
    wrap.setAttribute('aria-hidden', 'true');
    let box = wrap.appendChild(document.createElement('input'));
    box.type = 'checkbox';
    box.addEventListener('click', (e) => {
      // length of current codemirror
      let length = this.CodeMirror.state.doc.length;
      // turn currentVersion into an array
      let currentAsArr = this.CurrentVersion.split('\n');
      let newTextObj = Text.of(currentAsArr);
      // create transaction
      let transaction = this.CodeMirror.state.update({ changes: { from: 0, to: length, insert: newTextObj } });
      // dispatch transaction
      this.CodeMirror.dispatch(transaction);
      // destroy widget
      // this.destroy();
    });
    return wrap;
  }

  ignoreEvent() {
    return false;
  }
}
