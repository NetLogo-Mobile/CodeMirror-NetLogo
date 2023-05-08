import { Breed, Procedure } from '../classes/structures';
import { GalapagosEditor } from '../../editor';
import { StateNetLogo } from '../../codemirror/extension-state-netlogo';

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
export function GetProcedureCode(
  Snapshot: CodeSnapshot,
  Procedure: Procedure
): string {
  return Snapshot.Code.substring(
    Procedure.PositionStart,
    Procedure.PositionEnd
  );
}

/** BuildSnapshot: Build a snapshot of the code. */
export function BuildSnapshot(Galapagos: GalapagosEditor): CodeSnapshot {
  Galapagos.UpdateContext();
  // Here, we only care about the current snippet, not the entire shared context
  var State = Galapagos.GetState();
  // Get the components
  var Code = Galapagos.GetCode();
  var Extensions: string[] = State.Extensions;
  var Globals: string[] = State.Globals;
  // Get the breeds
  var Breeds = new Map<string, Breed>();
  for (var [Singular, Breed] of State.Breeds) {
    Breeds.set(Singular, JSON.parse(JSON.stringify(Breed)));
  }
  // Get the procedures
  var Procedures = new Map<string, Procedure>();
  for (var [Name, Procedure] of State.Procedures) {
    Procedures.set(Name, JSON.parse(JSON.stringify(Procedure)));
  }
  // Return the snapshot
  return { Code, Extensions, Globals, Breeds, Procedures };
}

/** IntegrateSnapshot: Integrate a snapshot into the code. */
export function IntegrateSnapshot(
  Galapagos: GalapagosEditor,
  Snapshot: CodeSnapshot
) {
  // Haven't decided about procedures yet
  // Integrate the breeds
  for (var [Singular, Breed] of Snapshot.Breeds) {
    Galapagos.Operations.AppendBreed(
      Breed.BreedType,
      Breed.Plural,
      Breed.Singular
    );
  }
  for (var [Singular, Breed] of Snapshot.Breeds) {
    Galapagos.Operations.AppendBreedVariables(Breed.Plural, Breed.Variables);
  }
  // Integrate the extensions
  Galapagos.Operations.AppendGlobals('Extensions', Snapshot.Extensions);
  // Integrate the globals
  Galapagos.Operations.AppendGlobals('Globals', Snapshot.Globals);
}
