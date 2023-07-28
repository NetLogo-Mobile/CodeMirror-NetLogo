import { selectAll } from '@codemirror/commands';
import { Decoration, DecorationSet, EditorView } from '@codemirror/view';
import { GalapagosEditor } from '../editor';
import { EditorState, StateEffect, StateField } from '@codemirror/state';
import { TextWidget, CheckboxWidget } from '../codemirror/widgets-changes';
import { ChangeSet } from '@codemirror/state';

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
  /** Instead of taking a previous version, have it take a change set that turns the previous version into the current version */
  HighlightChanges(changeSet: ChangeSet) {
    var editor = this.CodeMirror;
    var addedWords: Map<number, string> = new Map(); // map added word to their pos before the changeset
    var removedSections: Map<number, number> = new Map(); // removed section, key is start, value is end pos
    // fromA, toA (are the starts in the previous version), from B, toB are the ranges in the final version
    changeSet.iterChanges((fromA, toA, fromB, toB, inserted) => {
      // changes are insertions if inserted is not ''
      if (inserted.toString() != '') {
        addedWords.set(fromA, inserted.toString());
      } else {
        removedSections.set(fromA, toA);
      }
      console.log(fromA, toA, fromB, toB, inserted.toString());
    });
    console.log(removedSections);

    let hasDecorations: boolean = false;
    let clickedAfterDeco: boolean = false;

    // stateEffect for adding widget decorations(added words)
    const addTextWidget = StateEffect.define<{ from: number; to: number }>({
      map: ({ from, to }, change) => ({ from: change.mapPos(from), to: change.mapPos(to) }),
    });
    // stateEffect for marking removed words
    const removedEffect = StateEffect.define<{ from: number; to: number }>({
      map: ({ from, to }, change) => ({ from: change.mapPos(from), to: change.mapPos(to) }),
    });
    // define mark effect for removed words
    const removedMark = Decoration.mark({ attributes: { class: 'cm-removed' } });

    // stateField for tracking changes
    const changesField = StateField.define<DecorationSet>({
      create() {
        return Decoration.none;
      },
      update(value, tr) {
        value = value.map(tr.changes);
        if (hasDecorations && clickedAfterDeco) {
          // if clicked is true and we have decorations, then we remove decorations and return
          console.log('removing decorations');
          clickedAfterDeco = false;
          hasDecorations = false;
          // apply changeset
          // remove decorations
          return Decoration.none;
        }
        for (let e of tr.effects) {
          if (e.is(addTextWidget)) {
            let decorationWidget = Decoration.widget({
              widget: new TextWidget(addedWords.get(e.value.to) ?? 'wack', 'cm-added'), // if it is a removed word then add a "removed" widget decoration
              side: 1,
            });
            value = value.update({
              add: [decorationWidget.range(e.value.to)],
            });
            hasDecorations = true;
          } else if (e.is(removedEffect)) {
            let decorationMark = Decoration.mark({ attributes: { class: 'cm-removed' } });
            value = value.update({
              add: [decorationMark.range(e.value.from, e.value.to)],
            });
            hasDecorations = true;
          }
        }
        return value;
      },
      provide: (f) => EditorView.decorations.from(f),
    });

    /*makeWidget: creates a widget decoration of the given type and text. */
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

    // function to highlight sections that were removed
    function highlightRemoved(view: EditorView, from: number, to: number) {
      let effects: StateEffect<any>[] = [];
      effects.push(
        removedEffect.of({
          from: from,
          to: to,
        })
      );
      if (!effects.length) return false;
      if (!view.state.field(changesField, false)) {
        effects.push(StateEffect.appendConfig.of([changesField]));
      }
      view.dispatch({ effects });
      return true;
    }

    addedWords.forEach((value, key) => {
      makeWidget(this.CodeMirror, key);
    });

    removedSections.forEach((value, key) => {
      highlightRemoved(this.CodeMirror, key, value);
    });

    // create field to track when to remove decorations upon changing cursor selection
    const removedChangesField = StateField.define({
      create() {
        Decoration.none;
      },
      update(lines, tr) {
        if (tr && hasDecorations) {
          clickedAfterDeco = true;
          console.log('clicked ' + clickedAfterDeco);
          //editor.dispatch({changes: changeSet});
        }
        return;
      },
    });
    this.CodeMirror.dispatch({
      effects: StateEffect.appendConfig.of([removedChangesField]),
    });
    // #endregion
  }
}
