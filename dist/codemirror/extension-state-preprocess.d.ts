import { StateField, EditorState } from '@codemirror/state';
/** StatePreprocess: The first-pass state for the NetLogo Language. */
export declare class StatePreprocess {
    /** PluralBreeds: Breeds in the model. */
    PluralBreeds: string[];
    /** SingularBreeds: Breeds in the model. */
    SingularBreeds: string[];
    /** BreedVars: Breed variables in the model. */
    BreedVars: string[];
    /** Commands: Commands in the model. */
    Commands: Record<string, number>;
    /** Reporters: Reporters in the model. */
    Reporters: Record<string, number>;
    /** ParseState: Parse the state from an editor state. */
    ParseState(State: EditorState): StatePreprocess;
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
