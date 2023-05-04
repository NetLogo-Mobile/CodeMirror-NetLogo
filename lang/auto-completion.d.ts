import { CompletionSource, CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { GalapagosEditor } from '../editor';
/** AutoCompletion: Auto completion service for a NetLogo model. */
export declare class AutoCompletion {
    /** Editor: The editor instance. */
    private Editor;
    /** Constructor: Create a new auto completion service. */
    constructor(Editor: GalapagosEditor);
    /** BuiltinVariables: The completion list of built-in variables. */
    private BuiltinVariables;
    /** SharedIdentifiers: Shared built-in completions. */
    private SharedIdentifiers;
    /** LastExtensions: Cached extension list. */
    private LastExtensions;
    /** LastPrimitives: Cached primitive list. */
    private LastPrimitives;
    /** KeywordsToCompletions: Transform keywords to completions. */
    private KeywordsToCompletions;
    /** ParentMaps: Maps of keywords to parents.  */
    private ParentMaps;
    /** ParentTypes: Types of keywords.  */
    private ParentTypes;
    /** GetParentKeywords: Get keywords of a certain type. */
    private GetParentKeywords;
    /** getBreedCommands: Get breed commands. */
    private getBreedCommands;
    /** getBreedReporters: Get breed reporters. */
    private getBreedReporters;
    /** GetCompletion: Get the completion hint at a given context. */
    GetCompletion(Context: CompletionContext): CompletionResult | null | Promise<CompletionResult | null>;
    /** GetCompletionSource: Get the completion source for a NetLogo model. */
    GetCompletionSource(): CompletionSource;
}
//# sourceMappingURL=auto-completion.d.ts.map