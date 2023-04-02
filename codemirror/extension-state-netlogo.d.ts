import { StateField, EditorState } from '@codemirror/state';
import { Breed, Procedure } from '../lang/classes';
import { RuntimeError } from '../lang/linters/runtime-linter';
import { ParseMode } from '../editor-config';
/** StateNetLogo: The second-pass editor state for the NetLogo Language. */
export declare class StateNetLogo {
    /** Extensions: Extensions in the code. */
    Extensions: string[];
    /** Globals: Globals in the code. */
    Globals: string[];
    /** WidgetGlobals: Globals from the widgets. */
    WidgetGlobals: string[];
    /** Breeds: Breeds in the code. */
    Breeds: Map<string, Breed>;
    /** Procedures: Procedures in the code. */
    Procedures: Map<string, Procedure>;
    /** CompilerErrors: Errors from the compiler. */
    CompilerErrors: RuntimeError[];
    /** CompilerErrors: Errors during the runtime. */
    RuntimeErrors: RuntimeError[];
    /** IsDirty: Whether the current state is dirty. */
    private IsDirty;
    /** Version: Version of the state (for linter cache). */
    private Version;
    /** Mode: The editor's parsing mode. */
    Mode: ParseMode;
    /** GetBreedNames: Get names related to breeds. */
    GetBreedNames(): string[];
    /** GetBreeds: Get list of breeds. */
    GetBreeds(): Breed[];
    /** GetBreedVariables: Get variable names related to breeds. */
    GetBreedVariables(): string[];
    /** GetBreedFromVariable: Find the breed which defines a certain variable. */
    GetBreedFromVariable(varName: string): string | null;
    /** GetBreedFromProcedure: Get breed name from breed procedure. */
    GetBreedFromProcedure(term: string): string | null;
    /** GetProcedureFromVariable: Find the procedure that defines a certain variable. */
    GetProcedureFromVariable(varName: string, from: number, to: number): string | null;
    /** SetDirty: Make the state dirty. */
    SetDirty(): void;
    /** GetDirty: Gets if the state is dirty. */
    GetDirty(): boolean;
    /** GetVersion: Get version of the state. */
    GetVersion(): number;
    /** IncVersion: Increase version of the state. */
    IncVersion(): number;
    /** ParseState: Parse the state from an editor state. */
    ParseState(State: EditorState): StateNetLogo;
    /** getProcedure: Gather all information about a procedure. */
    private getProcedure;
    /** getContext: Identify context of a block by looking at primitives and variable names. */
    private getContext;
    /** getPrimitiveContext: Identify context for a builtin primitive. */
    private getPrimitiveContext;
    /** getCodeBlocks: Gather all information about a given code block. */
    private getCodeBlocks;
    /** getPrimitive: Gather information about the primitive whose argument is a code block. */
    private getPrimitive;
    /** searchAnonProcedure: Look for nested anonymous procedures within a node and procedure. */
    private searchAnonProcedure;
    /** checkRanges: Identify whether a node is inside the set of procedures or code blocks. */
    private checkRanges;
    /** getAnonProcedure: Gather information about the anonymous procedure. */
    private getAnonProcedure;
    /** getText: Get text for a given node. */
    private getText;
    /** getLocalVars: Collect local variables within a node. */
    private getLocalVars;
    /** getVariables: Get global or breed variables. */
    private getVariables;
    /** getArgs: Identify arguments for a given procedure. */
    private getArgs;
}
/** StateExtension: Extension for managing the editor state.  */
declare const stateExtension: StateField<StateNetLogo>;
export { stateExtension };
