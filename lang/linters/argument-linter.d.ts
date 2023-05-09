import { SyntaxNode } from '@lezer/common';
import { EditorState } from '@codemirror/state';
import { Linter } from './linter-builder';
import { PreprocessContext } from '../classes/contexts';
export declare const ArgumentLinter: Linter;
/** getArgs: collects everything used as an argument so it can be counted. */
export declare const getArgs: (Node: SyntaxNode) => {
    leftArgs: SyntaxNode | null;
    rightArgs: SyntaxNode[];
    func: SyntaxNode | null;
    hasParentheses: boolean;
};
/** checkValidNumArgs: checks if correct number of arguments are present. */
export declare const checkValidNumArgs: (state: EditorState, args: {
    leftArgs: SyntaxNode | null;
    rightArgs: SyntaxNode[];
    func: SyntaxNode | null;
    hasParentheses: boolean;
}, preprocessContext: PreprocessContext) => (string | number | boolean | null)[];
//# sourceMappingURL=argument-linter.d.ts.map