import { EditorView } from '@codemirror/view';
import { StateNetLogo } from '../../codemirror/extension-state-netlogo';
import { EditorState } from '@codemirror/state';
import { SyntaxNode } from '@lezer/common';
import { LintContext, PreprocessContext } from '../classes/contexts';
import { Diagnostic } from '@codemirror/lint';
/** CheckContext: The context of the current check. */
export interface CheckContext {
    state: EditorState;
    preprocessState: PreprocessContext;
    parseState: LintContext;
    breedNames: string[];
    breedVars: string[];
}
export declare const getCheckContext: (view: EditorView, lintContext: LintContext, preprocessContext: PreprocessContext) => CheckContext;
export declare const acceptableIdentifiers: string[];
export declare const checkValidIdentifier: (Node: SyntaxNode, value: string, context: CheckContext) => boolean;
export declare const getLocalVariables: (Node: SyntaxNode, State: EditorState, parseState: LintContext | StateNetLogo) => string[];
/** checkBreed: Checks if the term in the structure of a breed command/reporter and push lint messages */
export declare function checkBreed(diagnostics: Diagnostic[], context: CheckContext, view: EditorView, noderef: SyntaxNode): boolean;
//# sourceMappingURL=check-identifier.d.ts.map