import { SyntaxNode } from '@lezer/common';
import { EditorState } from '@codemirror/state';
import { StateNetLogo } from '../../codemirror/extension-state-netlogo';
export declare const IdentifierLinter: import("@codemirror/state").Extension;
export declare const checkValidIdentifier: (Node: SyntaxNode, value: string, state: EditorState, parseState: StateNetLogo) => boolean;
export declare const getLocalVars: (Node: SyntaxNode, state: EditorState, parseState: StateNetLogo) => string[];
