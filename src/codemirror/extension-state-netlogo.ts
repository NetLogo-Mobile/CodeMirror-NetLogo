import { StateField, Transaction } from "@codemirror/state"
import { EditorState } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";
import { Breed,LocalVariable,Procedure } from "../lang/classes";
import { cursorTo } from "readline";
import { VariableDeclaration } from "../lang/lang.terms";
import { stringify } from "querystring";

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
            if (Cursor.node.name == "BreedsOwn"){
                let breedName=""
                Cursor.node.getChildren("Own").map(node=>{
                    breedName = State.sliceDoc(node.from,node.to)
                    breedName=breedName.substring(0,breedName.length-4)
                    console.log(breedName)
                    if (breedName=='turtles'){
                        let newBreed = new Breed()
                        newBreed.Singular='turtle'
                        newBreed.Plural='turtles'
                        this.Breeds.push(newBreed)
                    }
                    else if (breedName=='patches'){
                        let newBreed = new Breed()
                        newBreed.Singular='patch'
                        newBreed.Plural='patches'
                        this.Breeds.push(newBreed)
                    }
                    else if (breedName=='links'){
                        let newBreed = new Breed()
                        newBreed.Singular='link'
                        newBreed.Plural='links'
                        this.Breeds.push(newBreed)
                    }
                })
                let breedVars: string[]=[]
                Cursor.node.getChildren("Identifier").map(node=> {
                    breedVars.push(State.sliceDoc(node.from,node.to))
                })
                this.Breeds.map(breed=> {
                    if (breed.Plural==breedName){
                        breed.Variables=breedVars
                    }
                })
                
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
                procedure.Arguments=getArgs(Cursor.node,State)
                Cursor.node.getChildren("ProcedureContent").map(Node => {
                    procedure.Variables = getLocalVars(Node,State)
                });   
                Cursor.node.getChildren("ProcedureContent").map(Node=>{
                    Node.getChildren("Primitive").map(node => {
                        node.getChildren("AnonymousProcedure").map(subnode => {
                            let anonProc=new Procedure()
                            anonProc.Name="Anonymous"+this.Procedures.length.toString()
                            anonProc.Arguments=getArgs(subnode,State)
                            anonProc.Variables=procedure.Variables.concat(getLocalVars(subnode,State))
                        })
                    })
                })             
                this.Procedures.push(procedure);                
            }
            if (!Cursor.nextSibling()) return this;
        }
    }
      
}


const getLocalVars = function(Node,State){
    let vars: LocalVariable[]=[]
    Node.getChildren("VariableDeclaration").map(node => {
        node.getChildren("NewVariableDeclaration").map(subnode => {
            subnode.getChildren("Identifier").map(subsubnode => {
                let variable = new LocalVariable()
                variable.Name=State.sliceDoc(subsubnode.from,subsubnode.to)
                variable.CreationPos=subsubnode.from
                vars.push(variable);
            })
        })
    })
    return vars
}

const getArgs = function(Node,State){
    let args: string[]=[]
    Node.getChildren("Arguments").map(node => {
        node.getChildren("Identifier").map(subnode =>{
            args.push(State.sliceDoc(subnode.from, subnode.to));
        })
    });
    return args
}

/** StateExtension: Extension for managing the editor state.  */
const stateExtension = StateField.define<StateNetLogo>({
  create: (State) => new StateNetLogo().ParseState(State),
  update: (Original: StateNetLogo, Transaction: Transaction) => {
    // console.log(Original)
    if (!Transaction.docChanged) return Original;
    return Original.ParseState(Transaction.state);
  },
});

export { stateExtension };
