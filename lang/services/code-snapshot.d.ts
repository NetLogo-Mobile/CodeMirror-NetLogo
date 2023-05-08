import { Breed, Procedure } from '../classes/structures';
/** CodeSnapshot: A snapshot of the code with grammatical structures. */
export interface CodeSnapshot {
    /** Code: The code of the snapshot. */
    Code: string;
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
}
//# sourceMappingURL=code-snapshot.d.ts.map