import { SyntaxNode } from '@lezer/common';
import { EditorState } from '@codemirror/state';
export declare const ArgumentLinter: import("@codemirror/state").Extension;
export declare const getArgs: (Node: SyntaxNode) => {
    leftArgs: SyntaxNode | null;
    rightArgs: SyntaxNode[];
    func: SyntaxNode | null;
    hasParentheses: boolean;
};
export declare const checkValidNumArgs: (state: EditorState, args: {
    leftArgs: SyntaxNode | null;
    rightArgs: SyntaxNode[];
    func: SyntaxNode | null;
    hasParentheses: boolean;
}) => (string | number | boolean)[];
