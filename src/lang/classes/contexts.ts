import { combineContexts } from 'src/utils/context-utils';
import { AgentContexts, Breed, BreedType, Procedure, CodeBlock, AnonymousProcedure } from './structures';

/** PreprocessContext: master context from preprocessing */
export class PreprocessContext {
  /** PluralBreeds: Breeds in the model. */
  public PluralBreeds: Map<string, number> = new Map<string, number>();
  /** SingularBreeds: Singular breeds in the model. */
  public SingularBreeds: Map<string, number> = new Map<string, number>();
  /** SingularToPlurals: Singular-to-plural mappings in the model. */
  public SingularToPlurals: Map<string, string> = new Map<string, string>();
  /** PluralToSingulars: Plural-to-singular mappings in the model. */
  public PluralToSingulars: Map<string, string> = new Map<string, string>();
  /** SpecialReporters: Reporter-to-plural mappings in the model. */
  public SpecialReporters: Map<string, string> = new Map<string, string>();
  /** BreedTypes: Breed types in the model. */
  public BreedTypes: Map<string, BreedType> = new Map<string, BreedType>();
  /** BreedVars: Breed variables in the model. */
  public BreedVars: Map<string, number> = new Map<string, number>();
  /** BreedVarToPlurals: Breed variable-plural mappings in the model. */
  public BreedVarToPlurals: Map<string, string[]> = new Map<string, string[]>();
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
    this.BreedTypes.clear();
    this.BreedVars.clear();
    this.BreedVarToPlurals.clear();
    this.Commands.clear();
    this.Reporters.clear();
    this.CommandsOrigin.clear();
    this.ReportersOrigin.clear();
    this.SpecialReporters.clear();
    return this;
  }
  /** GetBreedContext: Get the context for a breed. */
  public GetBreedContext(Name: string, IsVariable: boolean): AgentContexts {
    var Type = this.BreedTypes.get(Name);
    if (typeof Type === 'undefined') return new AgentContexts('O---'); // Default to observer
    if (Type == BreedType.DirectedLink || Type == BreedType.UndirectedLink) {
      return new AgentContexts('---L');
    } else if (Type == BreedType.Patch) {
      if (IsVariable) {
        return new AgentContexts('-TP-');
      } else {
        return new AgentContexts('--P-');
      }
    } else {
      return new AgentContexts('-T--');
    }
  }

  public GetSuperType(Name: string): null | string {
    var Type = this.BreedTypes.get(Name);
    if (Type == BreedType.Patch) return 'patches';
    else if (Type == BreedType.Turtle) return 'turtles';
    else if (Type == BreedType.DirectedLink || Type == BreedType.UndirectedLink) return 'links';
    return null;
  }

  /** GetBreedVariableContexts: Get the context for a breed variable. */
  public GetBreedVariableContexts(Name: string): AgentContexts | undefined {
    if (this.BreedVarToPlurals.has(Name)) {
      let breeds = this.BreedVarToPlurals.get(Name);
      if (breeds && breeds.length > 0) {
        let context = new AgentContexts();
        for (let b of breeds) {
          context = combineContexts(context, this.GetBreedContext(b, true));
        }
        return context;
      }
    } //return this.GetBreedContext(this.BreedVarToPlurals.get(Name)!, true);
  }
  /** GetReporterBreed: Get the breed for a reporter. */
  public GetReporterBreed(Name: string): string | undefined {
    // Build the cache
    if (this.SpecialReporters.size == 0) {
      for (let [Plural, Type] of this.BreedTypes) {
        switch (Type) {
          case BreedType.Turtle:
            this.SpecialReporters.set(Plural, Plural);
            this.SpecialReporters.set(Plural + '-at', Plural);
            this.SpecialReporters.set(Plural + '-here', Plural);
            this.SpecialReporters.set(Plural + '-on', Plural);
            break;
          case BreedType.Patch:
            this.SpecialReporters.set('patch-at', Plural);
            this.SpecialReporters.set('patch-here', Plural);
            this.SpecialReporters.set('patch-ahead', Plural);
            this.SpecialReporters.set('patch-at-heading-and-distance', Plural);
            this.SpecialReporters.set('patch-left-and-ahead', Plural);
            this.SpecialReporters.set('patch-right-and-ahead', Plural);
            this.SpecialReporters.set('neighbors', Plural);
            this.SpecialReporters.set('neighbors4', Plural);
            break;
          case BreedType.UndirectedLink:
          case BreedType.DirectedLink:
            var Singular = this.PluralToSingulars.get(Plural)!;
            this.SpecialReporters.set('link-at', Plural);
            this.SpecialReporters.set('out-' + Singular + '-to', Plural);
            this.SpecialReporters.set('in-' + Singular + '-from', Plural);
            this.SpecialReporters.set('my-' + Plural, Plural);
            this.SpecialReporters.set('my-in-' + Plural, Plural);
            this.SpecialReporters.set('my-out-' + Plural, Plural);
            this.SpecialReporters.set(Singular + '-with', Plural);
            // Turtles
            this.SpecialReporters.set('out-' + Singular + '-neighbors', 'turtles');
            this.SpecialReporters.set('in-' + Singular + '-neighbors', 'turtles');
            this.SpecialReporters.set(Singular + '-neighbors', 'turtles');
            break;
        }
      }
      // Find the reporter
      return this.SpecialReporters.get(Name);
    }
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
  /** GetDefined: Get defined names. */
  public GetDefined(): string[] {
    var defined = [];
    defined.push(...this.Globals.keys());
    defined.push(...this.WidgetGlobals.keys());
    defined.push(...this.Procedures.keys());
    defined.push(...this.GetBreedNames());
    defined.push(...this.GetBreedVariables());
    return defined;
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
    for (let breed of this.Breeds.values()) breedNames.push(breed.Plural);
    return breedNames;
  }
  /** GetBreedVariables: Get variable names related to breeds. */
  public GetBreedVariables(): string[] {
    var variables: string[] = [];
    for (let breed of this.Breeds.values()) variables = variables.concat(breed.Variables);
    return variables;
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

  private checkCodeBlocks(
    varName: string,
    blocks: CodeBlock[],
    proc_name: string,
    from: number,
    to: number
  ): string | null {
    for (let b of blocks) {
      // console.log(b)
      if (b.PositionEnd < from || b.PositionStart > to) continue;
      for (let localVar of b.Variables) {
        // console.log(localVar.Name,varName,localVar.CreationPos,to)
        if (localVar.Name == varName && localVar.CreationPos <= to) return proc_name;
      }
      // console.log("didn't find")
      let other = this.checkCodeBlocks(varName, b.CodeBlocks, proc_name, from, to);
      if (other != null) {
        return other;
      }
      let anon = this.checkAnonProc(varName, b.AnonymousProcedures, proc_name, from, to);
      if (anon != null) {
        return anon;
      }
    }
    return null;
  }

  private checkAnonProc(
    varName: string,
    anon: AnonymousProcedure[],
    proc_name: string,
    from: number,
    to: number
  ): string | null {
    for (let anonProc of anon) {
      if (anonProc.PositionEnd < from || anonProc.PositionStart > to) continue;
      if (anonProc.Arguments.includes(varName)) return '{anonymous},' + proc_name;
      for (let localVar of anonProc.Variables) {
        if (localVar.Name == varName && localVar.CreationPos <= to) return '{anonymous},' + proc_name;
      }
    }

    return null;
  }
  /** GetProcedureFromVariable: Find the procedure that defines a certain variable. */
  public GetProcedureFromVariable(varName: string, from: number, to: number): string | null {
    // console.log(from,to,"'"+varName+"'")
    for (let proc of this.Procedures.values()) {
      // console.log(proc)
      if (proc.PositionEnd < from || proc.PositionStart > to) continue;
      // Check the argument list in a procedure
      if (proc.Arguments.includes(varName)) return proc.Name;
      // Check the local variable list in a procedure
      for (let localVar of proc.Variables) {
        if (localVar.Name == varName && localVar.CreationPos <= to) return proc.Name;
      }
      // Check the anonymous arguments in a procedure
      let anon = this.checkAnonProc(varName, proc.AnonymousProcedures, proc.Name, from, to);
      // console.log(anon)
      if (anon != null) {
        return anon;
      }
      let other = this.checkCodeBlocks(varName, proc.CodeBlocks, proc.Name, from, to);
      // console.log(other)
      if (other != null) {
        return other;
      }
    }
    return null;
  }
}
