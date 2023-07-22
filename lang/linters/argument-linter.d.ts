import { EditorState } from '@codemirror/state';
import { SyntaxNode } from '@lezer/common';
import { Linter } from './linter-builder';
import { PreprocessContext } from '../classes/contexts';
export declare const ArgumentLinter: Linter;
/** ArgsInfo: Contains all the information about the arguments of a statement. */
interface ArgsInfo {
    leftArgs: SyntaxNode | null;
    rightArgs: SyntaxNode[];
    func: SyntaxNode | null;
    hasParentheses: boolean;
}
/** getArgs: collects everything used as an argument so it can be counted. */
export declare const getArgs: (Node: SyntaxNode) => ArgsInfo;
/** checkValidNumArgs: checks if correct number of arguments are present. */
export declare const checkValidNumArgs: (state: EditorState, args: ArgsInfo, preprocessContext: PreprocessContext) => (string | number | boolean | null)[];
export {};
//# sourceMappingURL=argument-linter.d.ts.map