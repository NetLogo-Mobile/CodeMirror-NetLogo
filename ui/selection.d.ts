import { EditorView } from '@codemirror/view';
import { GalapagosEditor } from '../editor';
/** SelectionFeatures: The selection and cursor features of the editor. */
export declare class SelectionFeatures {
    /** CodeMirror: The CodeMirror EditorView. */
    CodeMirror: EditorView;
    /** Galapagos: The Galapagos Editor. */
    Galapagos: GalapagosEditor;
    /** Constructor: Initialize the editing features. */
    constructor(Galapagos: GalapagosEditor);
    /** SelectAll: Select all text in the editor. */
    SelectAll(): void;
    /** Select: Select and scroll to a given range in the editor. */
    Select(Start: number, End: number): void;
    /** GetSelection: Returns an object of the start and end of
     *  a selection in the editor. */
    GetSelection(): {
        from: number;
        to: number;
    };
    /** GetSelections: Get the selections of the editor. */
    GetSelections(): readonly import("@codemirror/state").SelectionRange[];
    /** GetCursorPosition: Set the cursor position of the editor. */
    GetCursorPosition(): number;
    /** SetCursorPosition: Set the cursor position of the editor. */
    SetCursorPosition(position: number): void;
    /** RefreshCursor: Refresh the cursor position. */
    RefreshCursor(): void;
}
