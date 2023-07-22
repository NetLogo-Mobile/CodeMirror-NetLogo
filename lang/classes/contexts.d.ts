import { AgentContexts, Breed, BreedType, Procedure } from './structures';
/** PreprocessContext: master context from preprocessing */
export declare class PreprocessContext {
    /** PluralBreeds: Breeds in the model. */
    PluralBreeds: Map<string, number>;
    /** SingularBreeds: Singular breeds in the model. */
    SingularBreeds: Map<string, number>;
    /** SingularToPlurals: Singular-to-plural mappings in the model. */
    SingularToPlurals: Map<string, string>;
    /** PluralToSingulars: Plural-to-singular mappings in the model. */
    PluralToSingulars: Map<string, string>;
    /** SpecialReporters: Reporter-to-plural mappings in the model. */
    SpecialReporters: Map<string, string>;
    /** BreedTypes: Breed types in the model. */
    BreedTypes: Map<string, BreedType>;
    /** BreedVars: Breed variables in the model. */
    BreedVars: Map<string, number>;
    /** BreedVarToPlurals: Breed variable-plural mappings in the model. */
    BreedVarToPlurals: Map<string, string[]>;
    /** Commands: Commands in the model with number of arguments. */
    Commands: Map<string, number>;
    /** Reporters: Reporters in the model with number of arguments. */
    Reporters: Map<string, number>;
    /** CommandsOrigin: Commands in the model with editor ID. */
    CommandsOrigin: Map<string, number>;
    /** ReportersOrigin: Reporters in the model with editor ID. */
    ReportersOrigin: Map<string, number>;
    /** Clear: Clear the context. */
    Clear(): PreprocessContext;
    /** GetBreedContext: Get the context for a breed. */
    GetBreedContext(Name: string, IsVariable: boolean): AgentContexts;
    GetSuperType(Name: string): null | string;
    /** GetBreedVariableContexts: Get the context for a breed variable. */
    GetBreedVariableContexts(Name: string): AgentContexts | undefined;
    /** GetReporterBreed: Get the breed for a reporter. */
    GetReporterBreed(Name: string): string | undefined;
}
/** LintPreprocessContext: master context from statenetlogo */
export declare class LintContext {
    /** Extensions: Extensions in the code. */
    Extensions: Map<string, number>;
    /** Globals: Globals in the code. */
    Globals: Map<string, number>;
    /** WidgetGlobals: Globals from the widgets. */
    WidgetGlobals: Map<string, number>;
    /** Breeds: Breeds in the code. */
    Breeds: Map<string, Breed>;
    /** Procedures: Procedures in the code. */
    Procedures: Map<string, Procedure>;
    /** Clear: Clear the context. */
    Clear(): LintContext;
    /** GetDefined: Get defined names. */
    GetDefined(): string[];
    /** GetBreedNames: Get names related to breeds. */
    GetBreedNames(): string[];
    /** GetPluralBreedNames: Get plural names related to breeds. */
    GetPluralBreedNames(): string[];
    /** GetBreedVariables: Get variable names related to breeds. */
    GetBreedVariables(): string[];
    /** GetBreeds: Get list of breeds. */
    GetBreeds(): Breed[];
    /** GetBreedFromVariable: Find the breed which defines a certain variable. */
    GetBreedFromVariable(varName: string): string | null;
    /** GetProcedureFromVariable: Find the procedure that defines a certain variable. */
    GetProcedureFromVariable(varName: string, from: number, to: number): string | null;
}
//# sourceMappingURL=contexts.d.ts.map