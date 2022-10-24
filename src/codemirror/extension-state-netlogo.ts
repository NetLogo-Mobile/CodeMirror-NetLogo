import { StateField, Transaction } from "@codemirror/state"
import { EditorState } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";
import { Breed } from "../lang/classes";

/** StateNetLogo: Editor state for the NetLogo Language. */
export class StateNetLogo {
    /** Extensions: Extensions in the model. */
    public Extensions: string[] = [];
    /** Globals: Globals in the model. */
    public Globals: string[] = [];
    /** Breeds: Breeds in the model. */
    public Breeds: Breed[] = [];
    /** ParseState: Parse the state from an editor state. */
    public ParseState(State: EditorState): StateNetLogo {
        var Cursor = syntaxTree(State).cursor();
        if (!Cursor.firstChild()) return this;
        this.Breeds = [];
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
            if (!Cursor.nextSibling()) return this;
        }
    }
}

/** StateExtension: Extension for managing the editor state.  */
const stateExtension = StateField.define<StateNetLogo>({
    create: (State) => new StateNetLogo().ParseState(State),
    update: (Original: StateNetLogo, Transaction: Transaction) => {
        if (!Transaction.docChanged) return Original;
        return Original.ParseState(Transaction.state);
    }
});

export { stateExtension }; 