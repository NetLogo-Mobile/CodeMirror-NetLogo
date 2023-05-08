import { Breed, Procedure } from '../classes/structures';
import { GalapagosEditor } from '../../editor';
/** CodeSnapshot: A snapshot of the code with grammatical structures. */
export interface CodeSnapshot {
    /** Code: The code of the snapshot. */
    Code: string;
    /** Extensions: Extensions in the code. */
    Extensions: string[];
    /** Globals: Globals in the code. */
    Globals: string[];
    /** Breeds: Breeds in the code. */
    Breeds: Map<string, Breed>;
    /** Procedures: Procedures in the code. */
    Procedures: Map<string, Procedure>;
}
/** GetProcedureCode: Get the code of a procedure. */
export declare function GetProcedureCode(Snapshot: CodeSnapshot, Procedure: Procedure): string;
/** BuildSnapshot: Build a snapshot of the code. */
export declare function BuildSnapshot(Galapagos: GalapagosEditor): CodeSnapshot;
/** IntegrateSnapshot: Integrate a snapshot into the code. */
export declare function IntegrateSnapshot(Galapagos: GalapagosEditor, Snapshot: CodeSnapshot): void;
//# sourceMappingURL=code-snapshot.d.ts.map