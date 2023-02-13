import { StateField, Transaction, EditorState } from '@codemirror/state';

import { syntaxTree } from '@codemirror/language';
import {
  AnonymousProcedure,
  Breed,
  LocalVariable,
  Procedure,
} from '../lang/classes';
import { SyntaxNode, SyntaxNodeRef } from '@lezer/common';
import { RuntimeError } from '../lang/linters/runtime-linter';

/** StateNetLogo: Editor state for the NetLogo Language. */
export class StateNetLogo {
  // #region "Information"
  /** Extensions: Extensions in the code. */
  public Extensions: string[] = [];
  /** Globals: Globals in the code. */
  public Globals: string[] = [];
  /** WidgetGlobals: Globals from the widgets. */
  public WidgetGlobals: string[] = [];
  /** Breeds: Breeds in the code. */
  public Breeds: Map<string, Breed> = new Map<string, Breed>();
  /** Procedures: Procedures in the code. */
  public Procedures: Map<string, Procedure> = new Map<string, Procedure>();
  /** CompilerErrors: Errors from the compiler. */
  public CompilerErrors: RuntimeError[] = [];
  /** CompilerErrors: Errors during the runtime. */
  public RuntimeErrors: RuntimeError[] = [];
  /** IsDirty: Whether the current state is dirty. */
  private IsDirty: boolean = true;
  /** Version: Version of the state (for linter cache). */
  private Version: number = 0;
  // #endregion

  // #region "Utilities"
  /** GetBreedNames: Get names related to breeds. */
  public GetBreedNames(): string[] {
    var breedNames: string[] = [];
    for (let breed of this.Breeds.values()) {
      breedNames.push(breed.Singular);
      breedNames.push(breed.Plural);
    }
    return breedNames;
  }
  public GetBreeds(): Breed[] {
    var breedList: Breed[] = [];
    for (let breed of this.Breeds.values()) {
      breedList.push(breed);
    }
    return breedList;
  }
  /** GetBreedVariables: Get variable names related to breeds. */
  public GetBreedVariables(): string[] {
    var breedNames: string[] = [];
    for (let breed of this.Breeds.values()) {
      breedNames = breedNames.concat(breed.Variables);
    }
    return breedNames;
  }
  /** GetBreedFromVariable: Find the breed which defines a certain variable. */
  public GetBreedFromVariable(varName: string): string | null {
    for (let breed of this.Breeds.values()) {
      if (breed.Variables.includes(varName)) return breed.Plural;
    }
    return null;
  }

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
  // #endregion

  // #region "Version Control"
  /** SetDirty: Make the state dirty. */
  public SetDirty() {
    this.IsDirty = true;
  }
  /** GetDirty: Gets if the state is dirty. */
  public GetDirty() {
    return this.IsDirty;
  }
  /** GetVersion: Get version of the state. */
  public GetVersion(): number {
    return this.Version;
  }
  /** IncVersion: Increase version of the state. */
  public IncVersion(): number {
    return ++this.Version;
  }
  // #endregion

  // #region "Parsing"
  /** ParseState: Parse the state from an editor state. */
  public ParseState(State: EditorState): StateNetLogo {
    if (!this.IsDirty) return this;
    const Cursor = syntaxTree(State).cursor();
    if (!Cursor.firstChild()) return this;
    // Clear some global states to avoid contamination
    this.Breeds = new Map<string, Breed>();
    this.Procedures = new Map<string, Procedure>();
    this.Extensions = [];
    this.Globals = [];
    this.Breeds.set('turtle', new Breed('turtle', 'turtles', [], false));
    this.Breeds.set('patch', new Breed('patch', 'patches', [], false));
    this.Breeds.set('link', new Breed('link', 'links', [], true));
    // Start parsing
    while (true) {
      // get extensions
      if (Cursor.node.name == 'Extensions') {
        Cursor.node.getChildren('Extension').map((node) => {
          this.Extensions.push(this.getText(State, node));
        });
      }
      // get global variables
      if (Cursor.node.name == 'Globals') {
        this.Globals = this.getVariables(Cursor.node, State);
      }
      // get breeds
      if (Cursor.node.name == 'Breed') {
        const Plural = Cursor.node.getChildren('BreedPlural');
        const Singular = Cursor.node.getChildren('BreedSingular');
        let isLinkBreed = false;
        Cursor.node.getChildren('BreedDeclarative').map((node) => {
          isLinkBreed = node.getChildren('BreedStr').length == 1;
        });
        if (Plural.length == 1 && Singular.length == 1) {
          let singular = this.getText(State, Singular[0]);
          let breed = new Breed(
            singular,
            this.getText(State, Plural[0]),
            [],
            isLinkBreed
          );
          this.Breeds.set(singular, breed);
        }
      }
      // get breed variables
      if (Cursor.node.name == 'BreedsOwn') {
        let breedName = '';
        Cursor.node.getChildren('Own').map((node) => {
          breedName = this.getText(State, node);
          breedName = breedName.substring(0, breedName.length - 4);
        });
        let breedVars = this.getVariables(Cursor.node, State);
        for (let breed of this.Breeds.values()) {
          if (breed.Plural == breedName) {
            breed.Variables = breedVars;
          }
        }
      }
      // get procedures
      if (Cursor.node.name == 'Procedure') {
        let procedure = this.getProcedure(Cursor.node, State);
        this.Procedures.set(procedure.Name, procedure);
      }
      if (!Cursor.nextSibling()) {
        this.IncVersion();
        this.IsDirty = false;
        return this;
      }
    }
  }

  private getProcedure(node: SyntaxNode, State: EditorState): Procedure {
    let procedure = new Procedure();
    procedure.PositionStart = node.from;
    procedure.PositionEnd = node.to;
    procedure.IsCommand =
      this.getText(State, node.getChildren('To')[0].node).toLowerCase() == 'to';
    node.getChildren('ProcedureName').map((node) => {
      procedure.Name = this.getText(State, node);
    });
    procedure.Arguments = this.getArgs(node, State);
    procedure.Variables = this.getLocalVars(node, State, false);
    procedure.AnonymousProcedures = this.searchAnonProcedure(
      node,
      State,
      procedure
    );
    return procedure;
  }

  private searchAnonProcedure(
    node: SyntaxNode,
    State: EditorState,
    procedure: Procedure
  ): Procedure[] {
    let anonymousProcedures: Procedure[] = [];
    node.cursor().iterate((noderef) => {
      if (noderef.node.to > node.to) {
        return false;
      }
      if (
        node != noderef.node &&
        noderef.name == 'AnonymousProcedure' &&
        !this.checkRanges(anonymousProcedures, noderef.node)
      ) {
        anonymousProcedures.push(
          this.getAnonProcedure(noderef, State, procedure)
        );
      }
    });
    return anonymousProcedures;
  }

  private checkRanges(procedures: Procedure[], node: SyntaxNode): boolean {
    let included = false;
    for (let p of procedures) {
      if (p.PositionStart <= node.from && p.PositionEnd >= node.to) {
        included = true;
      }
    }
    return included;
  }

  private getAnonProcedure(
    noderef: SyntaxNodeRef,
    State: EditorState,
    procedure: Procedure
  ): Procedure {
    let anonProc = new Procedure();
    anonProc.PositionStart = noderef.from;
    anonProc.PositionEnd = noderef.to;
    anonProc.Variables = procedure.Variables;
    anonProc.isAnonymous = true;
    anonProc.Name = '';
    anonProc.IsCommand =
      noderef.node.getChildren('ProcedureContent').length > 0;
    let args: string[] = [];
    let Node = noderef.node;
    Node.getChildren('AnonArguments').map((node) => {
      node.getChildren('Identifier').map((subnode) => {
        args.push(this.getText(State, subnode));
      });
      node.getChildren('Arguments').map((subnode) => {
        subnode.getChildren('Identifier').map((subsubnode) => {
          args.push(this.getText(State, subsubnode));
        });
      });
    });
    anonProc.Arguments = args;
    anonProc.Variables = anonProc.Variables.concat(
      this.getLocalVars(Node, State, true)
    );

    if (anonProc.IsCommand) {
      anonProc.AnonymousProcedures = this.searchAnonProcedure(
        Node,
        State,
        anonProc
      );
    }
    return anonProc;
  }

  // getText: Get the text of a node.
  private getText(State: EditorState, Node: SyntaxNode): string {
    return State.sliceDoc(Node.from, Node.to).toLowerCase();
  }

  // get local variables for the procedure
  private getLocalVars(
    Node: SyntaxNode,
    State: EditorState,
    isAnon: Boolean
  ): LocalVariable[] {
    let localVars: LocalVariable[] = [];
    Node.cursor().iterate((noderef) => {
      if (noderef.node.to > Node.to) {
        return false;
      }
      if (noderef.name == 'CommandStatement') {
        noderef.node.getChildren('VariableDeclaration').map((node) => {
          node.getChildren('NewVariableDeclaration').map((subnode) => {
            subnode.getChildren('Identifier').map((subsubnode) => {
              if (
                !this.getParents(subsubnode).includes('AnonymousProcedure') ||
                isAnon
              ) {
                const variable = new LocalVariable(
                  this.getText(State, subsubnode),
                  1,
                  subsubnode.from
                );
                localVars.push(variable);
              }
            });
          });
        });
      }
    });
    return localVars;
  }

  private getParents(Node: SyntaxNode): string[] {
    let parents: string[] = [];
    let curr = Node;
    while (curr.parent) {
      parents.push(curr.parent.name);
      curr = curr.parent;
    }
    return parents;
  }

  private getVariables(Node: SyntaxNode, State: EditorState): string[] {
    let vars: string[] = [];
    Node.cursor().iterate((noderef) => {
      if (noderef.node.to > Node.to) {
        return false;
      }
      if (
        ['Identifier', 'BreedFirst', 'BreedMiddle', 'BreedLast'].includes(
          noderef.name
        )
      ) {
        vars.push(this.getText(State, noderef.node));
      }
    });
    return vars;
  }

  // get arguments for the procedure
  private getArgs(Node: SyntaxNode, State: EditorState): string[] {
    const args: string[] = [];
    Node.getChildren('Arguments').map((node) => {
      node.getChildren('Identifier').map((subnode) => {
        args.push(this.getText(State, subnode));
      });
    });
    return args;
  }
  // #endregion
}

/** StateExtension: Extension for managing the editor state.  */
const stateExtension = StateField.define<StateNetLogo>({
  create: (State) => new StateNetLogo().ParseState(State),
  update: (Original: StateNetLogo, Transaction: Transaction) => {
    if (Transaction.docChanged) {
      console.log(Original);
      Original.SetDirty();
    }
    return Original;
  },
});

export { stateExtension };
