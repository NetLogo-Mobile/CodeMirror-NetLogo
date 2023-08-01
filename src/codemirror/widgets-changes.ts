import { EditorView, WidgetType } from '@codemirror/view';
import { ChangeSet } from '@codemirror/state';

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
  private readonly line: number; // line number where widget is located
  private readonly changeset: ChangeSet; // changeset to apply when checkbox is clicked
  private dom: HTMLElement | null = null;
  constructor(editor: EditorView, line: number, cs: ChangeSet) {
    super();
    this.CodeMirror = editor;
    this.line = line;
    this.changeset = cs;
  }

  toDOM() {
    let wrap = document.createElement('span');
    wrap.setAttribute('aria-hidden', 'true');
    let box = wrap.appendChild(document.createElement('input'));
    box.type = 'checkbox';
    this.dom = wrap;
    wrap.addEventListener('click', this.handleEvent.bind(this));
    return wrap;
  }

  destroy(dom: HTMLElement) {
    console.log('destroying');
    dom.remove();
  }

  handleEvent() {
    console.log(this.line);
    // dispatch changeset to editor
    this.CodeMirror.dispatch({ changes: this.changeset });
  }

  /* takes the changeset and line, and creates a custom changeset for the line*/
  breakdownChangeSet() {
    let doc = this.CodeMirror.state.doc;
    // i
  }

  ignoreEvent() {
    return false;
  }
}
