import { selectAll } from '@codemirror/commands';
import { Decoration, DecorationSet, EditorView } from '@codemirror/view';
import { GalapagosEditor } from '../editor';
import { diffWords } from 'diff';
import { EditorState, StateEffect, StateField } from '@codemirror/state';
import { Text } from '@codemirror/text';
import { SearchCursor } from '@codemirror/search';
import { textWidget, CheckboxWidget } from './highlightWidgets';

/** SelectionFeatures: The selection and cursor features of the editor. */
export class SelectionFeatures {
  /** CodeMirror: The CodeMirror EditorView. */
  public CodeMirror: EditorView;
  /** Galapagos: The Galapagos Editor. */
  public Galapagos: GalapagosEditor;
  /** Constructor: Initialize the editing features. */
  public constructor(Galapagos: GalapagosEditor) {
    this.Galapagos = Galapagos;
    this.CodeMirror = Galapagos.CodeMirror;
  }

  // #region "Selection and Cursor"
  /** SelectAll: Select all text in the editor. */
  SelectAll() {
    selectAll(this.CodeMirror);
    this.CodeMirror.focus();
  }
  /** Select: Select and scroll to a given range in the editor. */
  Select(Start: number, End: number) {
    if (End > this.CodeMirror.state.doc.length || Start < 0 || Start > End) {
      return;
    }
    this.CodeMirror.dispatch({
      selection: { anchor: Start, head: End },
      scrollIntoView: true,
    });
    this.CodeMirror.focus();
  }
  /** GetSelection: Returns an object of the start and end of
   *  a selection in the editor. */
  GetSelection() {
    return {
      from: this.CodeMirror.state.selection.main.from,
      to: this.CodeMirror.state.selection.main.to,
    };
  }
  /** GetSelections: Get the selections of the editor. */
  GetSelections() {
    return this.CodeMirror.state.selection.ranges;
  }
  /** GetCursorPosition: Set the cursor position of the editor. */
  GetCursorPosition(): number {
    return this.CodeMirror.state.selection.ranges[0]?.from ?? 0;
  }
  /** SetCursorPosition: Set the cursor position of the editor. */
  SetCursorPosition(position: number) {
    this.CodeMirror.dispatch({
      selection: { anchor: position },
      scrollIntoView: true,
    });
  }
  /** RefreshCursor: Refresh the cursor position. */
  RefreshCursor() {
    this.SetCursorPosition(this.GetCursorPosition());
  }
  // #endregion

  // #region "Highlighting Changes"
  /** HighlightChanges: Highlight the changes in the editor. */
  HighlightChanges(PreviousVersion: string) {
    let clicked: boolean = false;
    // string of current state doc of editor at time of "HighlightChanges" call
    const CurrentVersion: string = this.CodeMirror.state.doc.toString();
    const currentState = this.CodeMirror.state;
    const editorView = this.CodeMirror;
    // create diff instance comparing previous version of string to current version
    const diff = diffWords(PreviousVersion, CurrentVersion);
    // separate words into added and removed
    const removed = diff.filter((part) => part.removed).map((part) => part.value);
    const added: string[] = diff.filter((part) => part.added).map((part) => part.value);

    // create a transaction so editorView shows previous version doc so as to highlight changes
    const length = this.CodeMirror.state.doc.length;
    const prevAsText = Text.of(PreviousVersion.split('\n'));
    const tr = this.CodeMirror.state.update({ changes: { from: 0, to: length, insert: prevAsText } });
    this.CodeMirror.dispatch(tr); // dispatch transaction

    // defining stateffect for removed words using mark decoration
    const removedEffect = StateEffect.define<{ from: number; to: number }>({
      map: ({ from, to }, change) => ({ from: change.mapPos(from), to: change.mapPos(to) }),
    });
    // stateEffect for added words using widget decoration
    const addTextWidget = StateEffect.define<{ from: number; to: number }>({
      map: ({ from, to }, change) => ({ from: change.mapPos(from), to: change.mapPos(to) }),
    });

    // define mark decoration for removed words
    const removedMark = Decoration.mark({ class: 'cm-removed' }); //mark decoration for removed words
    const removedTheme = EditorView.baseTheme({
      '.cm-removed': { textDecoration: 'line-through red', textDecorationThickness: '2px' },
    });

    // index tracker for added array (tells us which added words have already been highlighted )
    let addedIndex = 0;
    // define statefield for words needing to be highlighted
    const changesField = StateField.define<DecorationSet>({
      create() {
        return Decoration.none;
      },
      update(value, tr) {
        value = value.map(tr.changes);
        for (let e of tr.effects) {
          if (e.is(removedEffect)) {
            //if it is a removed word then add "removed" mark decoration
            value = value.update({
              add: [removedMark.range(e.value.from, e.value.to)],
            });
          } else if (e.is(addTextWidget)) {
            let decorationWidget = Decoration.widget({
              widget: new textWidget(added[addedIndex], '#32CD32', 'bold'), // if it is an added word then add a "added" widget decoration
              side: 1,
            });
            addedIndex++; // increment addedIndex because we have already added this word
            value = value.update({
              add: [decorationWidget.range(e.value.to)],
            });
          }
        }
        return value;
      },
      provide: (f) => EditorView.decorations.from(f),
    });

    /* highlightRemoved: searches for the removed word in previous string and highlights it as "removed" */
    function highlightRemoved(view: EditorView, word: string) {
      let effects: StateEffect<any>[] = [];
      // create a cursor to find the word
      let cursor = new SearchCursor(view.state.doc, word, 0);
      // find the word
      cursor.next();
      effects.push(
        removedEffect.of({
          from: cursor.value.from,
          to: cursor.value.to,
        })
      );
      if (!effects.length) return false;
      if (!view.state.field(changesField, false)) {
        effects.push(StateEffect.appendConfig.of([changesField, removedTheme]));
      }
      view.dispatch({ effects });
      return true;
    }

    /* makeWidget: creates a widget decoration of the added word (as 'text') and adds it to the EditorView at "end"*/
    function makeWidget(view: EditorView, end: number, type: string = 'text') {
      let effects: StateEffect<any>[] = [];
      if (type === 'text') {
        effects.push(
          addTextWidget.of({
            from: 0,
            to: end,
          })
        );
      }
      if (!effects.length) return false;
      effects.push(StateEffect.appendConfig.of([changesField]));
      view.dispatch({ effects });
      return true;
    }

    // iterate through removed words and highlight them
    removed.forEach((word) => highlightRemoved(this.CodeMirror, word));

    // iterate through added words and highlight them
    let currentPos = 0; // position tracker for added words so they are added in the correct position based on where diff put them in the consolidated string
    diff.forEach((part) => {
      //updated current position
      if (part.added) {
        // add the widget to the editor
        makeWidget(this.CodeMirror, currentPos);
      } else {
        // if it is not an added word, then update the current position to be after the word that was not added
        currentPos += part.value.length;
      }
    });

    function sleep(ms: number) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    function revert(view: EditorView, state: EditorState) {
      view.setState(state);
      return;
    }
    //   //create another statefield to remove the highlight after 5 seconds
    const removeChangesField = StateField.define({
      create() {
        Decoration.none;
      },
      update(lines, tr) {
        // check if cursor changed
        if (tr.selection && !clicked) {
          // if cursor changed, then remove the highlight
          console.log('selection changed ');
          sleep(50).then(() => {
            revert(editorView, currentState);
            clicked = false;
          });
        }
        return;
      },
    });
    // add the statefield to the editor
    this.CodeMirror.dispatch({
      effects: StateEffect.appendConfig.of([removeChangesField]),
    });
  }
  // #endregion
}
