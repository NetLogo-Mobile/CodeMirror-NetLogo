import { StateField, EditorState } from '@codemirror/state';
import { Breed, Procedure, AgentContexts, ContextError } from '../lang/classes/structures';
import { SyntaxNode } from '@lezer/common';
import { RuntimeError } from '../lang/linters/runtime-linter';
import { ParseMode } from '../editor-config';
import { PreprocessContext } from '../lang/classes/contexts';
/** StateNetLogo: The second-pass editor state for the NetLogo Language. */
export declare class StateNetLogo {
    /** Preprocess: Preprocess context from all editors in the first pass. */
    Preprocess: PreprocessContext;
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
    /** EditorID: The id of the editor. */
    EditorID: number;
    /** Context: The context of the editor. */
    Context: string;
    /** SetContext: Set the context of the editor. */
    SetContext(Context: string): boolean;
    /** SetDirty: Make the state dirty. */
    SetDirty(): void;
    /** GetDirty: Gets if the state is dirty. */
    GetDirty(): boolean;
    /** ParseState: Parse the state from an editor state. */
    ParseState(State: EditorState): StateNetLogo;
    /** gatherEmbeddedProcedure: Gather all information about a procedure in embedded mode. */
    private gatherEmbeddedProcedure;
    /** gatherOnelineProcedure: Gather all information about a procedure in embedded mode. */
    private gatherOnelineProcedure;
    /** gatherProcedure: Gather all information about a procedure. */
    private gatherProcedure;
    private checkReporterContext;
    /** getContext: Identify context of a block by looking at primitives and variable names. */
    private getContext;
    /** combineContext: Identify context of a block by combining with the previous context. */
    combineContext(node: SyntaxNode, state: EditorState, priorContext: AgentContexts, newContext: AgentContexts): AgentContexts[];
    /** getPrimitiveContext: Identify context for a builtin primitive. */
    private getPrimitiveContext;
    /** gatherCodeBlocks: Gather all information about code blocks inside a given node. */
    private gatherCodeBlocks;
    /** gatherCodeBlocks: Gather all information about a given code block. */
    private gatherCodeBlock;
    /** getPrimitive: Gather information about the primitive whose argument is a code block. */
    private getPrimitive;
    /** identifyBreed: Identify the breed context of a given node. */
    private identifyBreed;
    /** searchAnonProcedure: Look for nested anonymous procedures within a node and procedure. */
    private gatherAnonProcedures;
    /** checkRanges: Identify whether a node is inside the set of procedures or code blocks. */
    private checkRanges;
    /** getAnonProcedure: Gather information about an anonymous procedure. */
    private gatherAnonProcedure;
    /** getLocalVars: Collect local variables within a node. */
    private getLocalVars;
    /** getLocalVarsCommand: Collect local variables within a command statement. */
    private getLocalVarsCommand;
    /** getVariables: Get global or breed variables. */
    private getVariables;
    /** getArgs: Identify arguments for a given procedure. */
    private getArgs;
}
/** StateExtension: Extension for managing the editor state.  */
declare const stateExtension: StateField<StateNetLogo>;
export { stateExtension };
//# sourceMappingURL=extension-state-netlogo.d.ts.map