import { StateField, Transaction } from "@codemirror/state"
import { EditorState } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";

/** StateNetLogo: Editor state for the NetLogo Language. */
export class StateNetLogo {
    /** Extensions: Extensions in the model. */
    public Extensions: string[] = [];
    /** Globals: Globals in the model. */
    public Globals: string[] = [];
    /** ParseState: Parse the state from an editor state. */
    public ParseState(State: EditorState): StateNetLogo {
        var Cursor = syntaxTree(State).cursor();
        if (!Cursor.firstChild()) return this;
        while (true) {
            if (Cursor.node.name == "Extensions") {
                Cursor.node.getChildren("Extension").map(Node => {
                    this.Extensions.push(State.sliceDoc(Node.from, Node.to));
                });
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