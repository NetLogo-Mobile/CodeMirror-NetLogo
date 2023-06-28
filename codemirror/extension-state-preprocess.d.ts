import { StateField, EditorState } from '@codemirror/state';
import { GalapagosEditor } from '../editor';
import { BreedType } from '../lang/classes/structures';
/** StatePreprocess: The first-pass state for the NetLogo Language. */
export declare class StatePreprocess {
    /** PluralBreeds: Breeds in the model. */
    PluralBreeds: string[];
    /** SingularBreeds: Breeds in the model. */
    SingularBreeds: string[];
    /** SingularBreeds: Breed types in the model. */
    BreedTypes: BreedType[];
    /** BreedVars: Breed variables in the model. */
    BreedVars: string[];
    /** Commands: Commands in the model. */
    Commands: Map<string, number>;
    /** Reporters: Reporters in the model. */
    Reporters: Map<string, number>;
    /** Editor: The editor for the state. */
    Editor: GalapagosEditor | null;
    /** ParseState: Parse the state from an editor state. */
    ParseState(State: EditorState): StatePreprocess;
    /** SetEditor: Set the editor for the state. */
    SetEditor(Editor: GalapagosEditor): void;
    /** processBreedVars: Parse the code for breed variables. */
    private processBreedVars;
    /** processProcedures: Parse the code for procedure names. */
    private processProcedures;
    /** processBreeds: Parse the code for breed names. */
    private processBreeds;
}
/** StateExtension: Extension for managing the editor state.  */
declare const preprocessStateExtension: StateField<StatePreprocess>;
export { preprocessStateExtension };
//# sourceMappingURL=extension-state-preprocess.d.ts.map