import { StateField, Transaction, EditorState } from '@codemirror/state';

import { syntaxTree } from '@codemirror/language';
import {
  AnonymousProcedure,
  Breed,
  LocalVariable,
  Procedure,
} from '../lang/classes';
import { SyntaxNode } from '@lezer/common';
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
  /** GetBreedVariables: Get variable names related to breeds. */
  public GetBreedVariables(): string[] {
    var breedNames: string[] = [];
    for (let breed of this.Breeds.values()) {
      breedNames = breedNames.concat(breed.Variables);
    }
    return breedNames;
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
    this.Breeds = new Map<string, Breed>();
    this.Procedures = new Map<string, Procedure>();
    this.Breeds.set('turtle', new Breed('turtle', 'turtles', []));
    this.Breeds.set('patch', new Breed('patch', 'patches', []));
    this.Breeds.set('link', new Breed('link', 'links', []));
    while (true) {
      // get extensions
      if (Cursor.node.name == 'Extensions') {
        this.Extensions = [];
        Cursor.node.getChildren('Extension').map((node) => {
          this.Extensions.push(this.getText(State, node));
        });
      }
      // get global variables
      if (Cursor.node.name == 'Globals') {
        this.Globals = this.getVariables(Cursor.node, State);
        // this.Globals = [];
        // Cursor.node.getChildren('Identifier').map((Node) => {
        //   this.Globals.push(State.sliceDoc(Node.from, Node.to).toLowerCase());
        // });
      }
      // get breeds
      if (Cursor.node.name == 'Breed') {
        const Plural = Cursor.node.getChildren('BreedPlural');
        const Singular = Cursor.node.getChildren('BreedSingular');
        if (Plural.length == 1 && Singular.length == 1) {
          let singular = this.getText(State, Singular[0]);
          let breed = new Breed(singular, this.getText(State, Plural[0]), []);
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
        // const breedVars: string[] = [];
        // Cursor.node.getChildren('Identifier').map((node) => {
        //   breedVars.push(State.sliceDoc(node.from, node.to).toLowerCase());
        // });
        for (let breed of this.Breeds.values()) {
          if (breed.Plural == breedName) {
            breed.Variables = breedVars;
          }
        }
      }
      // get procedures
      if (Cursor.node.name == 'Procedure') {
        // TODO: From & To.
        let procedure = new Procedure(
          '',
          [],
          [],
          [],
          Cursor.node.from,
          Cursor.node.to
        );
        Cursor.node.getChildren('ProcedureName').map((node) => {
          procedure.Name = this.getText(State, node);
        });
        procedure.Arguments = this.getArgs(Cursor.node, State);
        procedure.Variables = this.getLocalVars(Cursor.node, State, false);

        Cursor.node.cursor().iterate((noderef) => {
          if (noderef.node.to > Cursor.node.to) {
            return false;
          }
          if (noderef.name == 'AnonymousProcedure') {
            let anonProc = new AnonymousProcedure(
              noderef.from,
              noderef.to,
              [],
              procedure.Variables
            );
            let args: string[] = [];
            let Node = noderef.node;
            Node.getChildren('AnonArguments').map((node) => {
              node.getChildren('Identifier').map((subnode) => {
                args.push(this.getText(State, subnode));
              });
            });
            anonProc.Arguments = args;
            anonProc.Variables = anonProc.Variables.concat(
              this.getLocalVars(Node, State, true)
            );
            procedure.AnonymousProcedures.push(anonProc);
          }
        });
        this.Procedures.set(procedure.Name, procedure);
      }
      if (!Cursor.nextSibling()) {
        this.IncVersion();
        this.IsDirty = false;
        return this;
      }
    }
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
    if (Transaction.docChanged) Original.SetDirty();
    return Original;
  },
});

export { stateExtension };
