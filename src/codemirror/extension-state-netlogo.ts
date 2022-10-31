import { StateField, Transaction, EditorState } from '@codemirror/state';

import { syntaxTree } from '@codemirror/language';
import { Breed, LocalVariable, Procedure } from '../lang/classes';
import { SyntaxNode } from '@lezer/common';

/** StateNetLogo: Editor state for the NetLogo Language. */
export class StateNetLogo {
  /** Extensions: Extensions in the model. */
  public Extensions: string[] = [];
  /** Globals: Globals in the model. */
  public Globals: string[] = [];
  /** Breeds: Breeds in the model. */
  public Breeds: Breed[] = [];
  /** Procedures: Procedures in the model. */
  public Procedures: Procedure[] = [];
  /** ParseState: Parse the state from an editor state. */
  public ParseState(State: EditorState): StateNetLogo {
    const Cursor = syntaxTree(State).cursor();
    if (!Cursor.firstChild()) return this;
    this.Breeds = [];
    this.Procedures = [];
    while (true) {
      // get extensions
      if (Cursor.node.name == 'Extensions') {
        this.Extensions = [];
        Cursor.node.getChildren('Extension').map((Node) => {
          this.Extensions.push(State.sliceDoc(Node.from, Node.to));
        });
      }
      // get global variables
      if (Cursor.node.name == 'Globals') {
        this.Globals = [];
        Cursor.node.getChildren('Identifier').map((Node) => {
          this.Globals.push(State.sliceDoc(Node.from, Node.to));
        });
      }
      // get breeds
      if (Cursor.node.name == 'Breed') {
        const Identifiers = Cursor.node.getChildren('Identifier');
        if (Identifiers.length == 2) {
          let plural = State.sliceDoc(Identifiers[0].from, Identifiers[0].to);
          let singular = State.sliceDoc(Identifiers[1].from, Identifiers[1].to);
          let breed = new Breed(singular, plural, []);
          this.Breeds.push(breed);
        }
      }
      // get breed variables
      if (Cursor.node.name == 'BreedsOwn') {
        let breedName = '';
        Cursor.node.getChildren('Own').map((node) => {
          breedName = State.sliceDoc(node.from, node.to);
          breedName = breedName.substring(0, breedName.length - 4);
          // these need to be always included but I haven't gotten there yet
          if (breedName == 'turtles') {
            const newBreed = new Breed('turtle', 'turtles', []);
            this.Breeds.push(newBreed);
          } else if (breedName == 'patches') {
            const newBreed = new Breed('patch', 'patches', []);
            this.Breeds.push(newBreed);
          } else if (breedName == 'links') {
            const newBreed = new Breed('link', 'links', []);
            this.Breeds.push(newBreed);
          }
        });
        const breedVars: string[] = [];
        Cursor.node.getChildren('Identifier').map((node) => {
          breedVars.push(State.sliceDoc(node.from, node.to));
        });
        this.Breeds.map((breed) => {
          if (breed.Plural == breedName) {
            breed.Variables = breedVars;
          }
        });
      }
      // get procedures
      if (Cursor.node.name == 'Procedure') {
        const procedure = new Procedure('', [], []);
        Cursor.node.getChildren('ProcedureName').map((Node) => {
          procedure.Name = State.sliceDoc(Node.from, Node.to);
        });
        procedure.Arguments = getArgs(Cursor.node, State);
        Cursor.node.getChildren('ProcedureContent').map((Node) => {
          procedure.Variables = procedure.Variables.concat(
            getLocalVars(Node, State)
          );
        });
        // Cursor.node.getChildren("ProcedureContent").map(Node=>{
        //     Node.getChildren("Primitive").map(node => {
        //         node.getChildren("AnonymousProcedure").map(subnode => {
        //             let anonProc=new Procedure()
        //             anonProc.Name="Anonymous"+this.Procedures.length.toString()
        //             anonProc.Arguments=getArgs(subnode,State)
        //             anonProc.Variables=procedure.Variables.concat(getLocalVars(subnode,State))
        //         })
        //     })
        // })
        this.Procedures.push(procedure);
      }
      if (!Cursor.nextSibling()) return this;
    }
  }
}

// get local variables for the procedure
const getLocalVars = function (Node: SyntaxNode, State: EditorState) {
  const vars: LocalVariable[] = [];
  Node.getChildren('VariableDeclaration').map((node) => {
    node.getChildren('NewVariableDeclaration').map((subnode) => {
      subnode.getChildren('Identifier').map((subsubnode) => {
        const variable = new LocalVariable(
          State.sliceDoc(subsubnode.from, subsubnode.to),
          1,
          subsubnode.from
        );
        vars.push(variable);
      });
    });
  });
  return vars;
};

// get arguments for the procedure
const getArgs = function (Node: SyntaxNode, State: EditorState) {
  const args: string[] = [];
  Node.getChildren('Arguments').map((node) => {
    node.getChildren('Identifier').map((subnode) => {
      args.push(State.sliceDoc(subnode.from, subnode.to));
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
