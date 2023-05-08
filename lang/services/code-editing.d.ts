import { EditorView } from '@codemirror/view';
import { ChangeSpec } from '@codemirror/state';
import { BreedType } from '../classes/structures';
import { GalapagosEditor } from '../../editor';
/** CodeEditing: Functions for editing code. */
export declare class CodeEditing {
    /** View: The editor view. */
    View: EditorView;
    /** Galapagos: The editor instance. */
    Galapagos: GalapagosEditor;
    /** Constructor: Create a new code editing service. */
    constructor(View: EditorView);
    /** InsertCode: Insert code snippets into the editor. */
    InsertCode(Changes: ChangeSpec): void;
    /** GetSlice: Get a slice of the code. */
    private GetSlice;
    /** FindFirstChild: Find the first child that matches a condition. */
    private FindFirstChild;
    /** AddTermToBracket: Add a term to a bracket. */
    private AddTermToBracket;
    /** AppendGlobals: Append items of a global statement to the editor. */
    AppendGlobals(Field: 'Globals' | 'Extensions', Items: string[]): boolean;
    /** AppendBreed: Append a breed to the editor. */
    AppendBreed(Type: BreedType, Plural: string, Singular: string): boolean;
    /** AppendBreedVariables: Add variables to a breed. */
    AppendBreedVariables(Plural: string, Variables: string[]): boolean;
    ReplaceProcedure(view: EditorView, name: string, content: string): void;
}
//# sourceMappingURL=code-editing.d.ts.map