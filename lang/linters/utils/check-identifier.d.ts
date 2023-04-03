import { EditorView } from "@codemirror/view";
import { StateNetLogo } from "../../../codemirror/extension-state-netlogo";
import { StatePreprocess } from "../../../codemirror/extension-state-preprocess";
import { EditorState } from '@codemirror/state';
import { SyntaxNode } from '@lezer/common';
/** CheckContext: The context of the current check. */
export interface CheckContext {
    state: EditorState;
    preprocessState: StatePreprocess;
    parseState: StateNetLogo;
    breedNames: string[];
    breedVars: string[];
}
export declare const getCheckContext: (view: EditorView) => CheckContext;
export declare const acceptableIdentifiers: string[];
export declare const checkValidIdentifier: (Node: SyntaxNode, value: string, context: CheckContext) => boolean;
export declare const getLocalVars: (Node: SyntaxNode, state: EditorState, parseState: StateNetLogo) => string[];
