import { Breed, Procedure } from './structures';

/** PreprocessContext: master context from preprocessing */
export class PreprocessContext {
  /** PluralBreeds: Breeds in the model. */
  public PluralBreeds: Map<string, number> = new Map<string, number>();
  /** SingularBreeds: Singular breeds in the model. */
  public SingularBreeds: Map<string, number> = new Map<string, number>();
  /** BreedVars: Breed variables in the model. */
  public BreedVars: Map<string, number> = new Map<string, number>();
  /** Commands: Commands in the model with number of arguments. */
  public Commands: Map<string, number> = new Map<string, number>();
  /** Reporters: Reporters in the model with number of arguments. */
  public Reporters: Map<string, number> = new Map<string, number>();
  /** CommandsOrigin: Commands in the model with editor ID. */
  public CommandsOrigin: Map<string, number> = new Map<string, number>();
  /** ReportersOrigin: Reporters in the model with editor ID. */
  public ReportersOrigin: Map<string, number> = new Map<string, number>();
  /** Clear: Clear the context. */
  public Clear(): PreprocessContext {
    this.PluralBreeds.clear();
    this.SingularBreeds.clear();
    this.BreedVars.clear();
    this.Commands.clear();
    this.Reporters.clear();
    this.CommandsOrigin.clear();
    this.ReportersOrigin.clear();
    return this;
  }
}

/** LintPreprocessContext: master context from statenetlogo */
export class LintContext {
  /** Extensions: Extensions in the code. */
  public Extensions: Map<string, number> = new Map<string, number>();
  /** Globals: Globals in the code. */
  public Globals: Map<string, number> = new Map<string, number>();
  /** WidgetGlobals: Globals from the widgets. */
  public WidgetGlobals: Map<string, number> = new Map<string, number>();
  /** Breeds: Breeds in the code. */
  public Breeds: Map<string, Breed> = new Map<string, Breed>();
  /** Procedures: Procedures in the code. */
  public Procedures: Map<string, Procedure> = new Map<string, Procedure>();
  /** Clear: Clear the context. */
  public Clear(): LintContext {
    this.Extensions.clear();
    this.Globals.clear();
    this.WidgetGlobals.clear();
    this.Breeds.clear();
    this.Procedures.clear();
    return this;
  }
  /** GetBreedNames: Get names related to breeds. */
  public GetBreedNames(): string[] {
    var breedNames: string[] = [];
    for (let breed of this.Breeds.values()) {
      breedNames.push(breed.Singular);
      breedNames.push(breed.Plural);
    }
    return breedNames;
  }
  /** GetPluralBreedNames: Get plural names related to breeds. */
  public GetPluralBreedNames(): string[] {
    var breedNames: string[] = [];
    for (let breed of this.Breeds.values()) {
      breedNames.push(breed.Plural);
    }
    return breedNames;
  }
  /** GetBreedVariables: Get variable names related to breeds. */
  public GetBreedVariables(): string[] {
    var breedNames: string[] = [];
    for (let breed of this.Breeds.values()) {
      breedNames = breedNames.concat(breed.Variables);
    }
    return breedNames;
  }
  /** GetBreeds: Get list of breeds. */
  public GetBreeds(): Breed[] {
    var breedList: Breed[] = [];
    for (let breed of this.Breeds.values()) {
      breedList.push(breed);
    }
    return breedList;
  }
  /** GetBreedFromVariable: Find the breed which defines a certain variable. */
  public GetBreedFromVariable(varName: string): string | null {
    for (let breed of this.Breeds.values()) {
      if (breed.Variables.includes(varName)) return breed.Plural;
    }
    return null;
  }
  /** GetBreedFromProcedure: Get breed name from breed procedure. */
  public GetBreedFromProcedure(term: string): string | null {
    let breed = '';
    for (let b of this.GetBreedNames()) {
      if (term.includes(b) && b.length > breed.length) {
        breed = b;
      }
    }
    return breed;
  }
  /** GetProcedureFromVariable: Find the procedure that defines a certain variable. */
  public GetProcedureFromVariable(
    varName: string,
    from: number,
    to: number
  ): string | null {
    for (let proc of this.Procedures.values()) {
      if (proc.PositionEnd < from || proc.PositionStart > to) continue;
      // Check the argument list in a procedure
      if (proc.Arguments.includes(varName)) return proc.Name;
      // Check the local variable list in a procedure
      for (let localVar of proc.Variables) {
        if (localVar.Name == varName && localVar.CreationPos <= to)
          return proc.Name;
      }
      // Check the anonymous arguments in a procedure
      for (let anonProc of proc.AnonymousProcedures) {
        if (anonProc.PositionEnd > from || anonProc.PositionStart < to)
          continue;
        if (anonProc.Arguments.includes(varName))
          return '{anonymous},' + proc.Name;
        for (let localVar of anonProc.Variables) {
          if (localVar.Name == varName && localVar.CreationPos <= to)
            return '{anonymous},' + proc.Name;
        }
      }
    }
    return null;
  }
}
