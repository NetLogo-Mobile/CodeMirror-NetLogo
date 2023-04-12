import { StateField, EditorState } from '@codemirror/state';
import { PreprocessContext } from '../lang/classes';
import { GalapagosEditor } from '../editor';
/** StatePreprocess: The first-pass state for the NetLogo Language. */
export declare class StatePreprocess {
    /** PluralBreeds: Breeds in the model. */
    PluralBreeds: string[];
    /** SingularBreeds: Breeds in the model. */
    SingularBreeds: string[];
    /** BreedVars: Breed variables in the model. */
    BreedVars: string[];
    /** Commands: Commands in the model. */
    Commands: Map<string, number>;
    /** Reporters: Reporters in the model. */
    Reporters: Map<string, number>;
    /** Context: The shared preprocess context. */
    Context: PreprocessContext | null;
    /** IsDirty: Whether the current state is dirty. */
    private IsDirty;
    private editor;
    /** SetDirty: Make the state dirty. */
    SetDirty(): void;
    /** GetDirty: Gets if the state is dirty. */
    GetDirty(): boolean;
    SetClean(): void;
    /** ParseState: Parse the state from an editor state. */
    ParseState(State: EditorState): StatePreprocess;
    SetEditor(editor: GalapagosEditor): void;
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
