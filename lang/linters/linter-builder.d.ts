import { Diagnostic } from '@codemirror/lint';
import { EditorView } from '@codemirror/view';
import { Extension } from '@codemirror/state';
import { StateNetLogo } from '../../codemirror/extension-state-netlogo';
import { LintContext, PreprocessContext } from '../classes/structures';
import { GalapagosEditor } from '../../editor';
/** Linter: A function that takes a view and parse state and returns a list of diagnostics. */
type Linter = (view: EditorView, preprocessContext: PreprocessContext, lintContext: LintContext, parseState?: StateNetLogo) => Diagnostic[];
/** buildLinter: Builds a linter extension from a linter function. */
declare const buildLinter: (Source: Linter, Editor: GalapagosEditor) => Extension;
export declare const getDiagnostic: (view: EditorView, node: {
    from: number;
    to: number;
}, message: string, severity?: 'error' | 'info' | 'warning') => Diagnostic;
export { buildLinter, Linter };
//# sourceMappingURL=linter-builder.d.ts.map