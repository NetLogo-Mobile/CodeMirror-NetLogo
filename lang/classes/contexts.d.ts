import { Breed, Procedure } from './structures';
/** PreprocessContext: master context from preprocessing */
export declare class PreprocessContext {
    /** PluralBreeds: Breeds in the model. */
    PluralBreeds: Map<string, number>;
    /** SingularBreeds: Singular breeds in the model. */
    SingularBreeds: Map<string, number>;
    /** BreedVars: Breed variables in the model. */
    BreedVars: Map<string, number>;
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
    /** GetBreedFromProcedure: Get breed name from breed procedure. */
    GetBreedFromProcedure(term: string): string | null;
    /** GetProcedureFromVariable: Find the procedure that defines a certain variable. */
    GetProcedureFromVariable(varName: string, from: number, to: number): string | null;
}
//# sourceMappingURL=contexts.d.ts.map