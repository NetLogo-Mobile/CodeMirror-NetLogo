import { StateField, Transaction } from "@codemirror/state"
import { EditorState } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";
import { Breed,Procedure } from "../lang/classes";
import { cursorTo } from "readline";

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
        var Cursor = syntaxTree(State).cursor();
        if (!Cursor.firstChild()) return this;
        this.Breeds = [];
        this.Procedures=[];
        while (true) {
            if (Cursor.node.name == "Extensions") {
                this.Extensions = [];
                Cursor.node.getChildren("Extension").map(Node => {
                    this.Extensions.push(State.sliceDoc(Node.from, Node.to));
                });
            }
            if (Cursor.node.name == "Globals") {
                this.Globals = [];
                Cursor.node.getChildren("Identifier").map(Node => {
                    this.Globals.push(State.sliceDoc(Node.from, Node.to));
                });
            }
            if (Cursor.node.name == "Breed") {
                let breed = new Breed();
                var Identifiers = Cursor.node.getChildren("Identifier");
                if (Identifiers.length == 2) {
                    breed.Singular = State.sliceDoc(Identifiers[0].from, Identifiers[0].to);
                    breed.Plural = State.sliceDoc(Identifiers[1].from, Identifiers[1].to);
                    breed.Variables = [];
                    this.Breeds.push(breed);
                }
            }
            if (Cursor.node.name == "Procedure") {
                let procedure = new Procedure();
                procedure.Name = "";
                procedure.Arguments=[];
                procedure.Variables=[];
                Cursor.node.getChildren("ProcedureName").map(Node => {
                    procedure.Name = State.sliceDoc(Node.from, Node.to);
                });
                Cursor.node.getChildren("Arguments").map(Node => {
                    Node.getChildren("Identifier").map(node =>{
                        procedure.Arguments.push(State.sliceDoc(node.from, node.to));
                    })
                });
                Cursor.node.getChildren("ProcedureContent").map(Node => {
                    Node.getChildren("VariableDeclaration").map(node => {
                        node.getChildren("NewVariableDeclaration").map(subnode => {
                            subnode.getChildren("Identifier").map(subsubnode => {
                                procedure.Variables.push(State.sliceDoc(subsubnode.from,subsubnode.to));
                            })
                        })
                    })
                });                
                this.Procedures.push(procedure);                
            }
            if (!Cursor.nextSibling()) return this;
        }
    }
}

/** StateExtension: Extension for managing the editor state.  */
const stateExtension = StateField.define<StateNetLogo>({
    create: (State) => new StateNetLogo().ParseState(State),
    update: (Original: StateNetLogo, Transaction: Transaction) => {
        // console.log(Original)
        if (!Transaction.docChanged) return Original;
        return Original.ParseState(Transaction.state);
    }
});

export { stateExtension }; 