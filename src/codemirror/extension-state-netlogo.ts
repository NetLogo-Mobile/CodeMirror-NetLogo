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
  /** Extensions: Extensions in the model. */
  public Extensions: string[] = [];
  /** Globals: Globals in the model. */
  public Globals: string[] = [];
  /** Breeds: Breeds in the model. */
  public Breeds: Map<string, Breed> = new Map<string, Breed>();
  /** Procedures: Procedures in the model. */
  public Procedures: Map<string, Procedure> = new Map<string, Procedure>();
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
        this.Globals = getVariables(Cursor.node, State);
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
        let breedVars = getVariables(Cursor.node, State);
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
        let procedure = new Procedure('', [], [], []);
        Cursor.node.getChildren('ProcedureName').map((Node) => {
          procedure.Name = State.sliceDoc(Node.from, Node.to).toLowerCase();
        });
        procedure.Arguments = getArgs(Cursor.node, State);
        procedure.Variables = getLocalVars(Cursor.node, State, false);

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
              getLocalVars(Node, State, true)
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
}

// get local variables for the procedure
const getLocalVars = function (
  Node: SyntaxNode,
  State: EditorState,
  isAnon: Boolean
) {
  let localVars: LocalVariable[] = [];
  Node.cursor().iterate((noderef) => {
    if (noderef.node.to > Node.to) {
      return false;
    }
    if (noderef.name == 'ProcedureContent') {
      noderef.node.getChildren('VariableDeclaration').map((node) => {
        node.getChildren('NewVariableDeclaration').map((subnode) => {
          subnode.getChildren('Identifier').map((subsubnode) => {
            if (
              !getParents(subsubnode).includes('AnonymousProcedure') ||
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
};

const getParents = function (Node: SyntaxNode) {
  let parents: string[] = [];
  let curr = Node;
  while (curr.parent) {
    parents.push(curr.parent.name);
    curr = curr.parent;
  }
  return parents;
};

const getVariables = function (Node: SyntaxNode, state: EditorState) {
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
};

// get arguments for the procedure
const getArgs = function (Node: SyntaxNode, State: EditorState) {
  const args: string[] = [];
  Node.getChildren('Arguments').map((node) => {
    node.getChildren('Identifier').map((subnode) => {
      args.push(State.sliceDoc(subnode.from, subnode.to).toLowerCase());
    });
  });
  return args;
};

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
