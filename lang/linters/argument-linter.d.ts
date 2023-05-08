import { SyntaxNode } from '@lezer/common';
import { EditorState } from '@codemirror/state';
import { Linter } from './linter-builder';
export declare const ArgumentLinter: Linter;
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
}, preprocessContext: PreprocessContext) => any[];
//# sourceMappingURL=argument-linter.d.ts.map