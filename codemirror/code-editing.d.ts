import { EditorView } from 'codemirror';
import { SyntaxNode } from '@lezer/common';
/** GalapagosEditing: Functions for editing code. */
export declare class GalapagosEditing {
    AppendGlobal(view: EditorView, content: string, statement_type: String): void;
    AddBreed(view: EditorView, breed: string, plural: string, singular: string): void;
    AddBreedVariable(view: EditorView, breed: string, varName: string): void;
    ReplaceProcedure(view: EditorView, name: string, content: string): void;
    AddTermToBracket(view: EditorView, content: string, node: SyntaxNode): void;
}
//# sourceMappingURL=code-editing.d.ts.map