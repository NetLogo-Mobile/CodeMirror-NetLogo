import { EditorView } from '@codemirror/view';
import { StateNetLogo } from '../../../codemirror/extension-state-netlogo';
import { EditorState } from '@codemirror/state';
import { SyntaxNode } from '@lezer/common';
import { LintContext, PreprocessContext } from '../../classes';
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
export declare const getLocalVars: (Node: SyntaxNode, state: EditorState, parseState: LintContext | StateNetLogo) => string[];
//# sourceMappingURL=check-identifier.d.ts.map