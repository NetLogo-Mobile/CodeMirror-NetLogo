import { EditorView } from '@codemirror/view';
import { GalapagosEditor } from '../editor';
import { Tree, SyntaxNodeRef } from '@lezer/common';
import { Diagnostic } from '@codemirror/lint';
/** SemanticFeatures: The linting, parsing, and highlighting features of the editor. */
export declare class SemanticFeatures {
    /** CodeMirror: The CodeMirror EditorView. */
    CodeMirror: EditorView;
    /** Galapagos: The Galapagos Editor. */
    Galapagos: GalapagosEditor;
    /** Constructor: Initialize the editing features. */
    constructor(Galapagos: GalapagosEditor);
    /** GetSyntaxTree: Get the syntax tree of the NetLogo code. */
    GetSyntaxTree(): Tree;
    /** SyntaxNodesAt: Iterate through syntax nodes at a certain position. */
    SyntaxNodesAt(Position: number, Callback: (Node: SyntaxNodeRef) => void): void;
    /** GetRecognizedMode: Get the recognized program mode. */
    GetRecognizedMode(): string;
    /** Highlight: Export the code in the editor into highlighted HTML. */
    Highlight(): HTMLElement;
    /** HighlightContent: Highlight a given snippet of code. */
    HighlightContent(Content: string): HTMLElement;
    /** HighlightTree: Highlight a parsed syntax tree and a snippet of code. */
    HighlightTree(Tree: Tree, Content: string): HTMLElement;
    /** TraverseNodes: Parse a snippet of code and traverse its syntax nodes. */
    private TraverseNodes;
    /** Prettify: Prettify the selection of NetLogo code. */
    Prettify(): void;
    /** PrettifyAll: Prettify all the NetLogo code. */
    PrettifyAll(): void;
    /** PrettifyOrAll: Prettify the selected code. If no code is selected, prettify all. */
    PrettifyOrAll(): void;
    /** ForEachDiagnostic: Loop through all linting diagnostics throughout the code. */
    ForEachDiagnostic(Callback: (d: Diagnostic, from: number, to: number) => void): void;
}
//# sourceMappingURL=semantics.d.ts.map