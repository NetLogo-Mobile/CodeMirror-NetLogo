import { StateField, EditorState } from '@codemirror/state';
import { Breed, Procedure, ContextError } from '../lang/classes';
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
    /** Mode: The editor's parsing mode. */
    Mode: ParseMode;
    /** RecognizedMode: The editor's recognized mode. */
    RecognizedMode: 'Unknown' | 'Model' | 'Command' | 'Reporter';
    /** ContextErrors: Context errors detected during processing. */
    ContextErrors: ContextError[];
    /** SetDirty: Make the state dirty. */
    SetDirty(): void;
    /** GetDirty: Gets if the state is dirty. */
    GetDirty(): boolean;
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
    private getBreedContext;
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
//# sourceMappingURL=extension-state-netlogo.d.ts.map