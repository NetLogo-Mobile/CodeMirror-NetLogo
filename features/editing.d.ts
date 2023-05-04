import { EditorView } from '@codemirror/view';
import { GalapagosEditor } from '../editor';
/** EditingFeatures: The editing features of the editor. */
export declare class EditingFeatures {
    /** CodeMirror: The CodeMirror EditorView. */
    CodeMirror: EditorView;
    /** Parent: The parent element of the editor. */
    Parent: HTMLElement;
    /** Galapagos: The Galapagos Editor. */
    Galapagos: GalapagosEditor;
    /** Constructor: Initialize the editing features. */
    constructor(Galapagos: GalapagosEditor);
    /** Undo: Make the editor undo. Returns false if no group was available. */
    Undo(): boolean;
    /** Redo: Make the editor Redo. Returns false if no group was available. */
    Redo(): boolean;
    /** Find: Find a keyword in the editor and loop over all matches. */
    Find(Keyword: string): void;
    /** Replace: Loop through the matches and replace one at a time. */
    Replace(Source: string, Target: string): void;
    /** FindAll: Find all the matching words in the editor. */
    FindAll(Source: string): void;
    /** ReplaceAll: Replace the all the matching words in the editor. */
    ReplaceAll(Source: string, Target: string): void;
    /** JumpTo: Jump to a certain line. */
    JumpTo(Line: number): void;
    /** ShowFind: Show the finding interface. */
    ShowFind(): void;
    /** ShowReplace: Show the replace interface. */
    ShowReplace(): void;
    /** ShowJumpTo: Show the jump-to-line interface. */
    ShowJumpTo(): void;
    /** HideJumpTo: Hide line interface. */
    HideJumpTo(): void;
    /** HideAllInterfaces: Hide all interfaces available. */
    HideAll(): void;
    /** ShowProcedures: Show a list of procedures for the user to jump to. */
    ShowProcedures(): void;
}
//# sourceMappingURL=editing.d.ts.map