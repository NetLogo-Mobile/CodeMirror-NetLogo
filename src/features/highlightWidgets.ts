import { EditorView, WidgetType } from '@codemirror/view';
import { Text } from '@codemirror/text';

/* textWidget: Subclass of WidgetType, used to create a CM6 Widget representing some text and its styling */
export class textWidget extends WidgetType {
  widgetText: string;
  textColor: string;
  fontWeight: string;
  textDecoration: string;
  decoThickness: string;
  bgColor: string;
  constructor(text: string, color = '', decoration = '', decoThickness = '', bgColor = '', fontWeight: string = '') {
    super();
    this.widgetText = text;
    this.textColor = color;
    this.textDecoration = decoration;
    this.decoThickness = decoThickness;
    this.bgColor = bgColor;
    this.fontWeight = fontWeight;
  }

  toDOM() {
    let wrap = document.createElement('span');
    wrap.setAttribute('aria-hidden', 'true');
    wrap.className = 'cm-text';
    wrap.textContent = this.widgetText;
    // optional parameters
    if (this.textColor != '') wrap.style.color = this.textColor;
    if (this.textDecoration != '') wrap.style.textDecoration = this.textDecoration;
    if (this.decoThickness != '') wrap.style.textDecorationThickness = this.decoThickness;
    if (this.bgColor != '') wrap.style.backgroundColor = this.bgColor;
    if (this.fontWeight != '') wrap.style.fontWeight = this.fontWeight;
    return wrap;
  }
}

/* CheckboxWidget: Subclass of WidgetType used to create a "checkbox" DOM feature to accept changes in the highlight feature */
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
      //this.destroy();
    });
    return wrap;
  }

  ignoreEvent() {
    return false;
  }
}
