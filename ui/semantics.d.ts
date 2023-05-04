import { EditorView } from '@codemirror/view';
import { GalapagosEditor } from '../editor';
import { Tree } from '@lezer/common';
import { Diagnostic } from '@codemirror/lint';
/** SemanticFeatures: The linting, parsing, and highlighting features of the editor. */
export declare class SemanticFeatures {
    /** CodeMirror: The CodeMirror EditorView. */
    CodeMirror: EditorView;
    /** Galapagos: The Galapagos Editor. */
    Galapagos: GalapagosEditor;
    /** Constructor: Initialize the editing features. */
    constructor(Galapagos: GalapagosEditor);
    /** Highlight: Export the code in the editor into highlighted HTML. */
    Highlight(): HTMLElement;
    /** HighlightContent: Highlight a given snippet of code. */
    HighlightContent(Content: string): HTMLElement;
    /** HighlightTree: Highlight a parsed syntax tree and a snippet of code. */
    HighlightTree(Tree: Tree, Content: string): HTMLElement;
    /** TraverseNodes: Parse a snippet of code and traverse its syntax nodes. */
    private TraverseNodes;
    /** Prettify: Prettify the selection ofNetLogo code. */
    Prettify(): void;
    /** PrettifyAll: Prettify all the NetLogo code. */
    PrettifyAll(): void;
    /** ForEachDiagnostic: Loop through all linting diagnostics throughout the code. */
    ForEachDiagnostic(Callback: (d: Diagnostic, from: number, to: number) => void): void;
}
