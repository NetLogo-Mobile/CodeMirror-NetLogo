import { EditorView, WidgetType } from '@codemirror/view';
import { ChangeSet, ChangeSpec, StateField } from '@codemirror/state';
import { Line, Text } from '@codemirror/text';
import { Change } from 'diff';
import { Decoration } from '@codemirror/view';

/* TextWidget: A CM6 Widget representing some text and its styling. */
export class TextWidget extends WidgetType {
  private readonly CodeMirror: EditorView;
  private readonly changeSet: ChangeSet;

  constructor(private text: string, private className: string = '', editor: EditorView, cs: ChangeSet) {
    super();
    this.CodeMirror = editor;
    this.changeSet = cs;
  }

  toDOM() {
    let wrap = document.createElement('span');
    wrap.setAttribute('aria-hidden', 'true');
    wrap.className = `cm-text ${this.className}`;
    wrap.textContent = this.text;
    wrap.addEventListener('click', this.handleEvent.bind(this));
    return wrap;
  }

  //handleEvent(): handles onclick event for text widget, on click will accept changeset and apply it
  handleEvent() {
    // dispatch a no-op selection transaction to codemirror, if the text widget is clicked
    // because the statefield uses transaction.selection to accept changes in auto accept mode
    let transaction = this.CodeMirror.state.update({ selection: this.CodeMirror.state.selection });
    this.CodeMirror.dispatch(transaction);
  }
}

/* CheckboxWidget: A "checkbox" DOM feature to accept changes. */
export class CheckboxWidget extends WidgetType {
  private readonly CodeMirror: EditorView;
  private readonly line: Line; // line number where widget is located
  private readonly changeset: ChangeSet; // changeset to apply when checkbox is clicked
  private dom: HTMLElement | null = null;
  constructor(editor: EditorView, line: Line, cs: ChangeSet) {
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
    let customChange: ChangeSet = this.getLineCS();
    console.log(customChange);
    // dispatch changeset to editor
    this.CodeMirror.dispatch({ changes: customChange });
    // change the changest so its reflected by the other copies of the changeset in the editor
  }

  /* takes the changeset and line, and creates a custom changeset for the line*/
  getLineCS() {
    let doc = this.CodeMirror.state.doc;
    let lineChanges: ChangeSpec[] = []; // array to hold changes for the line

    // iterate through the set and find the changes that are on the line
    this.changeset.iterChanges((fromA, toA, fromB, toB, inserted) => {
      if (doc.lineAt(toA).number === this.line.number) {
        lineChanges.push({ from: fromA, to: toA, insert: inserted }); // collect the change
      }
    });

    // create a new changeset with the changes for the line
    let lineChangeSet = ChangeSet.of(lineChanges, doc.length);
    return lineChangeSet;
  }

  /* removeLineDeco: removes the decoration of the widget's line */
  removeLineDeco() {
    /* to be implemented  */
  }
  ignoreEvent() {
    return false;
  }
}
