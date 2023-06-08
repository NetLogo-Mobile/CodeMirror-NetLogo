import { Diagnostic } from '@codemirror/lint';
import { EditorView } from '@codemirror/view';
import { Extension, EditorState } from '@codemirror/state';
import { StateNetLogo } from '../../codemirror/extension-state-netlogo';
import { LintContext, PreprocessContext } from '../classes/contexts';
import { GalapagosEditor } from '../../editor';
/** Linter: A function that takes a view and parse state and returns a list of diagnostics. */
type Linter = (view: EditorView, preprocessContext: PreprocessContext, lintContext: LintContext, parseState?: StateNetLogo) => Diagnostic[];
/** buildLinter: Builds a linter extension from a linter function. */
declare const buildLinter: (Source: Linter, Editor: GalapagosEditor) => Extension;
/** getLintState: Returns the internal CodeMirror lint state. */
export declare const getLintState: (state: EditorState) => any;
/** getDiagnostic: Returns a diagnostic object from a node and message. */
export declare const getDiagnostic: (view: EditorView, node: {
    from: number;
    to: number;
}, message: string, severity?: 'error' | 'info' | 'warning', ...values: string[]) => Diagnostic;
/** getNodeTo: Returns the proper end of a node. */
export declare const getNodeTo: (node: {
    from: number;
    to: number;
}, view: EditorView) => number;
export { buildLinter, Linter };
//# sourceMappingURL=linter-builder.d.ts.map