import { StateField, Transaction, EditorState } from '@codemirror/state';

import { syntaxTree } from '@codemirror/language';
import {
  AnonymousProcedure,
  Breed,
  LocalVariable,
  Procedure,
} from '../lang/classes';
import { SyntaxNode } from '@lezer/common';

/** StateNetLogo: Editor state for the NetLogo Language. */
export class StateNetLogo {
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
  /** ParseState: Parse the state from an editor state. */
  public ParseState(State: EditorState): StateNetLogo {
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
        Cursor.node.getChildren('Extension').map((Node) => {
          this.Extensions.push(
            State.sliceDoc(Node.from, Node.to).toLowerCase()
          );
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
        const Identifiers = Cursor.node.getChildren('Identifier');
        if (Identifiers.length == 2) {
          let plural = State.sliceDoc(
            Identifiers[0].from,
            Identifiers[0].to
          ).toLowerCase();
          let singular = State.sliceDoc(
            Identifiers[1].from,
            Identifiers[1].to
          ).toLowerCase();
          let breed = new Breed(singular, plural, []);
          this.Breeds.set(singular, breed);
        }
      }
      // get breed variables
      if (Cursor.node.name == 'BreedsOwn') {
        let breedName = '';
        Cursor.node.getChildren('Own').map((node) => {
          breedName = State.sliceDoc(node.from, node.to).toLowerCase();
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
        let procedure = new Procedure(
          '',
          [],
          [],
          [],
          Cursor.node.from,
          Cursor.node.to
        );
        Cursor.node.getChildren('ProcedureName').map((Node) => {
          procedure.Name = State.sliceDoc(Node.from, Node.to).toLowerCase();
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
                args.push(
                  State.sliceDoc(subnode.from, subnode.to).toLowerCase()
                );
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
        return this;
      }
    }
  }

  // get local variables for the procedure
  public getLocalVars(
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
                  State.sliceDoc(subsubnode.from, subsubnode.to).toLowerCase(),
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

  private getVariables(Node: SyntaxNode, state: EditorState): string[] {
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
        vars.push(state.sliceDoc(noderef.from, noderef.to).toLowerCase());
      }
    });
    return vars;
  }

  // get arguments for the procedure
  private getArgs(Node: SyntaxNode, State: EditorState): string[] {
    const args: string[] = [];
    Node.getChildren('Arguments').map((node) => {
      node.getChildren('Identifier').map((subnode) => {
        args.push(State.sliceDoc(subnode.from, subnode.to).toLowerCase());
      });
    });
    return args;
  }
}

/** StateExtension: Extension for managing the editor state.  */
const stateExtension = StateField.define<StateNetLogo>({
  create: (State) => new StateNetLogo().ParseState(State),
  update: (Original: StateNetLogo, Transaction: Transaction) => {
    if (!Transaction.docChanged) return Original;
    Original.ParseState(Transaction.state);
    console.log(Original);
    return Original;
  },
});

export { stateExtension };
