import { EditorView } from "@codemirror/view";
import { StateNetLogo, stateExtension } from "../../../codemirror/extension-state-netlogo";
import { StatePreprocess, preprocessStateExtension } from "../../../codemirror/extension-state-preprocess";
import { EditorState } from '@codemirror/state';
import { SyntaxNode } from '@lezer/common';
import { CodeBlock, Procedure } from "../../classes";

/** CheckContext: The context of the current check. */
export interface CheckContext {
    state: EditorState,
    preprocessState: StatePreprocess,
    parseState: StateNetLogo,
    breedNames: string[],
    breedVars: string[]
}

/* getCheckContext: gets the context of the current check. */
export const getCheckContext = function (view: EditorView): CheckContext {
    var state = view.state;
    var parseState = state.field(stateExtension);
    return {
        state: state,
        preprocessState: state.field(preprocessStateExtension),
        parseState: parseState,
        breedNames: parseState.GetBreedNames(),
        breedVars: parseState.GetBreedVariables()
    }
}


// always acceptable identifiers (Unrecognized is always acceptable because previous linter already errors)
export const acceptableIdentifiers = [
    'Unrecognized',
    'NewVariableDeclaration',
    'ProcedureName',
    'Arguments',
    'AnonArguments',
    'Globals',
    'BreedSingular',
    'BreedPlural',
    'BreedsOwn',
    'Extensions',
];

// checkValidIdentifier: Checks identifiers for valid variable/procedure/breed names
export const checkValidIdentifier = function (
    Node: SyntaxNode,
    value: string,
    context: CheckContext
): boolean {
    value = value.toLowerCase();
    // checks if parent is in a category that is always valid (e.g. 'Globals')
    if (acceptableIdentifiers.includes(Node.parent?.name ?? '')) return true;
    // checks if identifier is a global variable
    if (
        context.parseState.Globals.includes(value) ||
        context.parseState.WidgetGlobals.includes(value) ||
        context.parseState.Procedures.has(value) ||
        context.preprocessState.Commands[value] ||
        context.preprocessState.Reporters[value]
    )
        return true;
    // checks if identifier is a breed name or variable
    if (context.breedNames.includes(value) || context.breedVars.includes(value)) return true;
    // checks if identifier is a variable already declared in the procedure
    // collects list of valid local variables for given position
    let procedureVars = getLocalVars(Node, context.state, context.parseState);
    //checks if the identifier is in the list of possible variables
    return procedureVars.includes(value);
};

// getLocalVars: collects list of valid local variables for given position
export const getLocalVars = function (
    Node: SyntaxNode,
    state: EditorState,
    parseState: StateNetLogo
) {
    // get the procedure name
    let curr_node = Node;
    let procedureName = '';
    while (curr_node.parent) {
        curr_node = curr_node.parent;
        if (curr_node.name == 'Procedure') {
            curr_node.getChildren('ProcedureName').map((child) => {
                procedureName = state.sliceDoc(child.from, child.to);
            });
            break;
        }
    }
    // gets list of procedure variables from own procedure, as well as list of all procedure names
    let procedureVars: string[] = [];
    if (procedureName != '') {
        let procedure = parseState.Procedures.get(procedureName.toLowerCase());
        procedure?.Variables.map((variable) => {
            // makes sure the variable has already been created
            if (variable.CreationPos < Node.from) {
                procedureVars.push(variable.Name);
            }
        });
        //pulls out all local variables within the anonymous procedures up until current position
        if (procedure) {
            procedureVars.push(
                ...gatherAnonVars(procedure.AnonymousProcedures, Node)
            );
            procedureVars.push(...gatherAnonVars(procedure.CodeBlocks, Node));
        }
        if (procedure?.Arguments) {
            procedureVars.push(...procedure.Arguments);
        }
    }
    return procedureVars;
};

// gatherAnonVars: collects out valid local variables from anonymous procedures and code blocks
const gatherAnonVars = function (
    group: CodeBlock[] | Procedure[],
    Node: SyntaxNode
) {
    let procedureVars: string[] = [];
    group.map((anonProc) => {
        if (
            Node.from >= anonProc.PositionStart &&
            Node.to <= anonProc.PositionEnd
        ) {
            anonProc.Variables.map((variable) => {
                if (variable.CreationPos <= Node.from) {
                    procedureVars.push(variable.Name);
                }
            });
            procedureVars.push(...anonProc.Arguments);
            procedureVars.push(...gatherAnonVars(anonProc.CodeBlocks, Node));
            procedureVars.push(...gatherAnonVars(anonProc.AnonymousProcedures, Node));
        }
    });
    return procedureVars;
};
