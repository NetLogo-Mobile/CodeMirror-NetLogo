import { EditorView } from '@codemirror/view';
import { ChangeSpec } from '@codemirror/state';
import { BreedType } from '../classes/structures';
/** CodeEditing: Functions for editing code. */
export declare class CodeEditing {
    /** View: The editor view. */
    View: EditorView;
    /** Constructor: Create a new code editing service. */
    constructor(View: EditorView);
    /** InsertCode: Insert code snippets into the editor. */
    InsertCode(Changes: ChangeSpec): void;
    /** GetSlice: Get a slice of the code. */
    private GetSlice;
    /** FindFirstNode: Find the first node that matches a condition. */
    private FindFirstNode;
    /** AddTermToBracket: Add a term to a bracket. */
    private AddTermToBracket;
    /** AppendGlobals: Append items of a global statement to the editor. */
    AppendGlobals(Field: 'global' | 'extension', Items: string[]): void;
    /** AppendBreed: Append a breed to the editor. */
    AppendBreed(Type: BreedType, Plural: string, Singular: string): void;
    /** AddBreedVariables: Add variables to a breed. */
    AddBreedVariables(Breed: string, Variables: string[]): void;
    ReplaceProcedure(view: EditorView, name: string, content: string): void;
}
//# sourceMappingURL=code-editing.d.ts.map